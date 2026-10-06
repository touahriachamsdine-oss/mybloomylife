// Cross-instance OTP regression test. Run with `node scripts/test-auth-storage.mjs`.
//
// The bug this guards: verification codes lived in a module-level Map
// (src/lib/code-store.ts), so on Vercel the instance that issued a code was
// never the instance that verified it, and login could not complete anywhere
// except a local single-process dev server.
//
// The decisive assertion is "code issued by instance A validates on instance
// B": instance A is killed before verification, so nothing of it survives
// except what is in Postgres. A shared-memory or per-process store fails this.
//
// Mail is never sent. The child processes get GMAIL_USER / GMAIL_APP_PASSWORD
// as empty strings, which makes gmailConfigured false and takes the dev branch
// that logs the code instead of emailing it. If those vars were still
// populated from .env.local, send-code would answer 502 (the @test.local
// recipient is undeliverable) and the assertions would fail loudly rather than
// silently sending mail.
//
// Note: Next 16.3 refuses a second `next dev` for the same directory
// ("Another next dev server is already running"), so the instances are started
// sequentially. That is a stronger test than overlapping them.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT_A = Number(process.env.OTP_PORT_A ?? 3141);
const PORT_B = Number(process.env.OTP_PORT_B ?? 3142);
const require = createRequire(join(ROOT, "package.json"));

const failures = [];
let passed = 0;
function check(label, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS - ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL - ${label}${detail ? ` [${detail}]` : ""}`);
  }
}

function readEnvFile() {
  // .env.local is written with a UTF-8 BOM in front of the first key, which
  // defeats a naive /^(\w+)=/ match and silently yields no DATABASE_URL.
  const env = {};
  const text = readFileSync(join(ROOT, ".env.local"), "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(\w+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const envFile = readEnvFile();
if (!envFile.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL not parsed from .env.local");
  process.exit(1);
}
const { neon } = require("@neondatabase/serverless");
const sql = neon(envFile.DATABASE_URL);

const children = [];
function startServer(port) {
  const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "-p", String(port)], {
    cwd: ROOT,
    env: {
      ...process.env,
      GMAIL_USER: "",
      GMAIL_APP_PASSWORD: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  const state = { child, port, logs: "", codes: new Map(), ready: false };
  const onData = (chunk) => {
    const text = chunk.toString();
    state.logs += text;
    // Only the dev branch (no mail configured) logs the code.
    const re = /Verification code for (\S+) \((\w+)\): (\d{6})/g;
    let m;
    while ((m = re.exec(text)) !== null) state.codes.set(`${m[1]}|${m[2]}`, m[3]);
    if (/ready in|Local:\s+http/.test(text)) state.ready = true;
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  return state;
}

function stopServer(child) {
  if (child && child.exitCode === null && !child.killed) child.kill("SIGKILL");
}

async function waitReady(state, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (state.ready) {
      // next dev answers 404 until a route has compiled, so readiness of "/"
      // is not readiness of the API. Probe with a body that fails validation:
      // it forces compilation without issuing a code.
      try {
        const r = await fetch(`http://127.0.0.1:${state.port}/api/auth/send-code`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        if (r.status === 400) return true;
      } catch {
        /* not accepting connections yet */
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function post(port, path, body) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    let json = null;
    try { json = await r.json(); } catch { /* non-json */ }
    return { status: r.status, json };
  } catch (err) {
    return { status: 0, json: null, error: String(err) };
  }
}

async function get(port, path) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}${path}`);
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-json */ }
    return { status: r.status, text, json };
  } catch (err) {
    return { status: 0, text: "", json: null, error: String(err) };
  }
}

async function cleanupFixture() {
  const codes = await sql`DELETE FROM auth_codes WHERE email LIKE '%@test.local' RETURNING email`;
  const state = await sql`
    DELETE FROM bloom_state
    WHERE id NOT IN ('bloom_registered_users', 'bloom_storage_version', 'bloom_theme_mode')
    RETURNING id
  `;
  console.log(`  cleanup: removed ${codes.length} auth fixture row(s), ${state.length} stray state row(s)`);
}

const stamp = Date.now();
const addr = (n) => `otp.test.${stamp}.${n}@test.local`;

console.log("=== start instance A ===");
const A = startServer(PORT_A);
check("server started", await waitReady(A));

const emailA = addr("a");
let r = await post(PORT_A, "/api/auth/send-code", { email: emailA, purpose: "login" });
check("send-code accepted", r.status === 200 && r.json?.ok === true, `status=${r.status} body=${JSON.stringify(r.json)}`);
check("code was issued", A.codes.has(`${emailA}|login`), `logs=${JSON.stringify([...A.codes.keys()])}`);
const codeA = A.codes.get(`${emailA}|login`);

r = await post(PORT_A, "/api/auth/send-code", { email: emailA, purpose: "login" });
check("second send within cooldown -> 429", r.status === 429 && r.json?.error === "too_many_requests",
  `status=${r.status} body=${JSON.stringify(r.json)}`);

console.log("=== kill instance A, start instance B (fresh process) ===");
stopServer(A.child);
await new Promise((res) => setTimeout(res, 2000));

const B = startServer(PORT_B);
const bReady = await waitReady(B);
check("second server started", bReady);
if (!bReady) {
  console.log("--- instance B logs ---");
  console.log(B.logs.slice(-3000));
}

r = await post(PORT_B, "/api/auth/send-code", { email: emailA, purpose: "login" });
check("send-code route compiled (instance B)", r.status === 400 || r.status === 429, `status=${r.status} body=${JSON.stringify(r.json)}`);
check("cooldown issued by A is enforced by B", r.status === 429 && r.json?.error === "too_many_requests",
  `status=${r.status} body=${JSON.stringify(r.json)}`);

r = await post(PORT_B, "/api/auth/verify-code", { email: "warmup@x.test", code: "000000", purpose: "login" });
check("verify-code route compiled", r.status === 400, `status=${r.status}`);

// The whole point: A issued the code, A is dead, B must still verify it.
r = await post(PORT_B, "/api/auth/verify-code", { email: emailA, code: codeA, purpose: "login" });
check("code issued by instance A validates on instance B", r.status === 200 && r.json?.ok === true,
  `status=${r.status} body=${JSON.stringify(r.json)} code=${codeA}`);

r = await post(PORT_B, "/api/auth/verify-code", { email: emailA, code: "999999", purpose: "login" });
check("a wrong code is still rejected", r.status === 400, `status=${r.status} body=${JSON.stringify(r.json)}`);

r = await post(PORT_B, "/api/auth/verify-code", { email: emailA, code: codeA, purpose: "login" });
check("code is consumed after successful use", r.status === 400, `status=${r.status} body=${JSON.stringify(r.json)}`);

console.log("=== attempt cap ===");
const emailCap = addr("cap");
r = await post(PORT_B, "/api/auth/send-code", { email: emailCap, purpose: "login" });
const codeCap = B.codes.get(`${emailCap}|login`);
check("cap target issued", r.status === 200 && !!codeCap, `status=${r.status}`);

let capped = null;
for (let i = 0; i < 6; i += 1) {
  capped = await post(PORT_B, "/api/auth/verify-code", { email: emailCap, code: String(100000 + i), purpose: "login" });
  if (capped.status === 429) break;
}
check("wrong attempts are capped -> 429", capped?.status === 429 && capped.json?.error === "too_many_attempts",
  `status=${capped?.status} body=${JSON.stringify(capped?.json)}`);

console.log("=== purpose separation ===");
const emailReg = addr("reg");
r = await post(PORT_B, "/api/auth/send-code", { email: emailReg, purpose: "register" });
const codeReg = B.codes.get(`${emailReg}|register`);
check("register code logged", r.status === 200 && !!codeReg, `status=${r.status}`);

r = await post(PORT_B, "/api/auth/verify-code", { email: emailReg, code: codeReg, purpose: "login" });
check("register code rejected for login purpose", r.status === 400, `status=${r.status} body=${JSON.stringify(r.json)}`);

r = await post(PORT_B, "/api/auth/verify-code", { email: emailReg, code: codeReg, purpose: "register" });
check("wrong-purpose attempt does NOT consume the code", r.status === 200, `status=${r.status} body=${JSON.stringify(r.json)}`);

console.log("=== sync must not leak auth material ===");
const s = await get(PORT_B, "/api/sync");
check("GET /api/sync reachable", s.status === 200 && !!s.json, `status=${s.status}`);
check("sync response contains no auth_codes material", !s.text.includes("auth_codes"));
check("sync response contains no verification code", !s.text.includes(String(codeA ?? "")));

await cleanupFixture();
for (const c of children) stopServer(c);

console.log(`\n${failures.length === 0 ? "PASS" : "FAIL"} - ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("failed: " + failures.join(" | "));
  process.exit(1);
}