type StoredCode = {
  code: string;
  expiresAt: number;
  purpose: "login" | "register";
};

// In-memory store. For a multi-server/production deployment, replace with a
// database or cache (Redis) that is shared across instances.
const store = new Map<string, StoredCode>();

const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function issueCode(email: string, purpose: "login" | "register"): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  store.set(email.toLowerCase(), { code, expiresAt: Date.now() + TTL_MS, purpose });
  return code;
}

export function checkCode(
  email: string,
  code: string,
  purpose: "login" | "register"
): { valid: boolean; reason?: string } {
  const entry = store.get(email.toLowerCase());
  if (!entry) return { valid: false, reason: "no_code" };
  if (entry.expiresAt < Date.now()) {
    store.delete(email.toLowerCase());
    return { valid: false, reason: "expired" };
  }
  if (entry.purpose !== purpose) return { valid: false, reason: "purpose" };
  if (entry.code !== code.trim()) return { valid: false, reason: "mismatch" };
  store.delete(email.toLowerCase());
  return { valid: true };
}
