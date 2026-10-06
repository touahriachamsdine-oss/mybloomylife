import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ensureSchema, sql } from "./db";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

type StoredCode = {
  code: string;
  expiresAt: number;
  purpose: "login" | "register";
};

// Fallback used only when no DATABASE_URL is configured at all (local dev
// without a DB). When a database IS configured we use it exclusively and fail
// closed on errors - silently degrading to this Map would reintroduce the exact
// bug being fixed: codes living in one process's memory are invisible to the
// process that answers the verify request.
const memory = new Map<string, StoredCode & { attempts: number; lastSentAt: number }>();

const TTL_MS = 10 * 60 * 1000;
// Cooldown between two codes to one address. This is the protection against
// using send-code as an email-bombing tool against a victim's inbox.
const SEND_COOLDOWN_MS = 60 * 1000;
// Failed guesses allowed against one code. A 6-digit code with 5 attempts has a
// 5-in-a-million chance of being hit; afterwards the code is destroyed.
const MAX_ATTEMPTS = 5;

const SEND_TOO_MANY = "too_many_requests";
const STORAGE_DOWN = "storage_unavailable";

function keyOf(email: string): string {
  return email.trim().toLowerCase();
}

// Only a salted digest is persisted; the code itself is never stored.
//
// scrypt rather than a fast hash. The code is 6 digits, so there are only a
// million possible values: SHA-256 would let anyone who can read this row
// recover a live code by hashing all 1e6 candidates in a fraction of a second,
// which defeats the purpose of storing a digest at all. scrypt costs ~50ms per
// attempt here, so grinding through 1e6 candidates takes days while a code
// only stays valid for 10 minutes.
//
// The address is mixed into the password so the same code for two accounts
// produces different digests.
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;
// 128 * N * r = 16 MiB working memory; give scrypt headroom so it does not
// fall back or throw under Node's default 32 MiB cap.
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

async function derive(email: string, code: string, salt: Buffer): Promise<Buffer> {
  return scrypt(`${email}\u0000${code}`, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM,
  });
}

// Stored as "<salt hex>:<derived hex>".
async function hashOf(email: string, code: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await derive(email, code, salt);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function hashMatches(stored: string, email: string, code: string): Promise<boolean> {
  const [saltHex, wantHex] = stored.split(":");
  if (!saltHex || !wantHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const want = Buffer.from(wantHex, "hex");
  if (want.length !== SCRYPT_KEYLEN) return false;
  const got = await derive(email, code, salt);
  return timingSafeEqual(want, got);
}

function generateCode(): string {
  // crypto.randomInt, not Math.random: this value authorises account access.
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type IssueResult = { issued: boolean; code?: string; reason?: string };
export type CheckResult = { valid: boolean; reason?: string };

// Issue a fresh code for an address, subject to a per-address cooldown.
export async function issueCode(email: string, purpose: "login" | "register"): Promise<IssueResult> {
  const key = keyOf(email);

  if (!sql) {
    // No database configured: single-process dev fallback.
    const prev = memory.get(key);
    if (prev && Date.now() - prev.lastSentAt < SEND_COOLDOWN_MS) {
      return { issued: false, reason: SEND_TOO_MANY };
    }
    const code = generateCode();
    memory.set(key, {
      code,
      purpose,
      expiresAt: Date.now() + TTL_MS,
      attempts: 0,
      lastSentAt: Date.now(),
    });
    return { issued: true, code };
  }

  if (!(await ensureSchema())) return { issued: false, reason: STORAGE_DOWN };

  const code = generateCode();
  try {
    const digest = await hashOf(key, code);
    // The cooldown is enforced by the UPDATE's WHERE clause rather than a
    // separate read, so two concurrent requests cannot both pass the check and
    // both send an email. Zero rows returned means the cooldown still applies.
    const rows = (await sql`
      INSERT INTO auth_codes (email, code_hash, purpose, expires_at, attempts, last_sent_at)
      VALUES (${key}, ${digest}, ${purpose}, now() + interval '10 minutes', 0, now())
      ON CONFLICT (email) DO UPDATE SET
        code_hash    = EXCLUDED.code_hash,
        purpose      = EXCLUDED.purpose,
        expires_at   = EXCLUDED.expires_at,
        attempts     = 0,
        last_sent_at = now()
      WHERE auth_codes.last_sent_at < now() - interval '60 seconds'
      RETURNING email
    `) as { email: string }[];
    if (rows.length === 0) return { issued: false, reason: SEND_TOO_MANY };
    return { issued: true, code };
  } catch (e) {
    console.error("[code-store] issueCode failed:", e);
    // Fail closed. Falling back to memory here would issue a code that the
    // verify request cannot see.
    return { issued: false, reason: STORAGE_DOWN };
  }
}

// Drop a code without validating it. Called when the email carrying it could
// not be delivered, so an immediate retry is not blocked by the send cooldown
// for a code the user never received.
export async function discardCode(email: string): Promise<void> {
  const key = keyOf(email);
  if (!sql) {
    memory.delete(key);
    return;
  }
  try {
    await ensureSchema();
    await sql`DELETE FROM auth_codes WHERE email = ${key}`;
  } catch (e) {
    // Best effort: a row that outlives a failed send is only a 60s cooldown.
    console.error("[code-store] discardCode failed:", e);
  }
}

// Validate a submitted code. Consumes it on success, and destroys it entirely
// once attempts are exhausted so it cannot be retried further.
export async function checkCode(
  email: string,
  code: string,
  purpose: "login" | "register"
): Promise<CheckResult> {
  const key = keyOf(email);
  const submitted = code.trim();

  if (!sql) {
    const entry = memory.get(key);
    if (!entry) return { valid: false, reason: "no_code" };
    if (entry.expiresAt < Date.now()) {
      memory.delete(key);
      return { valid: false, reason: "expired" };
    }
    if (entry.purpose !== purpose) return { valid: false, reason: "purpose" };
    if (entry.attempts >= MAX_ATTEMPTS) {
      memory.delete(key);
      return { valid: false, reason: "too_many_attempts" };
    }
    if (entry.code !== submitted) {
      entry.attempts += 1;
      return { valid: false, reason: "mismatch" };
    }
    memory.delete(key);
    return { valid: true };
  }

  if (!(await ensureSchema())) return { valid: false, reason: STORAGE_DOWN };

  try {
    const rows = (await sql`
      SELECT code_hash, purpose, expires_at, attempts
      FROM auth_codes WHERE email = ${key}
    `) as { code_hash: string; purpose: string; expires_at: string; attempts: number }[];

    const row = rows[0];
    if (!row) return { valid: false, reason: "no_code" };

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await sql`DELETE FROM auth_codes WHERE email = ${key}`;
      return { valid: false, reason: "expired" };
    }

    if (row.purpose !== purpose) return { valid: false, reason: "purpose" };

    if (row.attempts >= MAX_ATTEMPTS) {
      await sql`DELETE FROM auth_codes WHERE email = ${key}`;
      return { valid: false, reason: "too_many_attempts" };
    }

    if (!(await hashMatches(row.code_hash, key, submitted))) {
      await sql`UPDATE auth_codes SET attempts = attempts + 1 WHERE email = ${key}`;
      return { valid: false, reason: "mismatch" };
    }

    await sql`DELETE FROM auth_codes WHERE email = ${key}`;
    return { valid: true };
  } catch (e) {
    console.error("[code-store] checkCode failed:", e);
    // Fail closed: an unreachable store must not admit a login.
    return { valid: false, reason: STORAGE_DOWN };
  }
}
