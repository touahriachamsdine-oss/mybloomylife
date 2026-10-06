// Verification gate: locale parity, source encoding, and a production smoke
// test. Run with `node scripts/verify.mjs` from anywhere.
//
// Lives in the repo rather than a temp directory because a periodic Windows
// temp cleaner was deleting these harnesses mid-session, destroying the proof
// that fixes work.
//
// Exits non-zero if any check fails.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["en", "ar", "fr", "kab"];
const failures = [];

function check(label, ok, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"} - ${label}${!ok && detail ? ` [${detail}]` : ""}`);
  if (!ok) failures.push(label);
}

// ---------- 1. locales ----------
console.log("=== locale parity ===");
const locales = JSON.parse(readFileSync(join(ROOT, "src/app/locales.json"), "utf8"));
const present = LANGS.filter((l) => locales[l]);
check(`all four languages present (have: ${present.join(", ")})`, present.length === 4);

const keysets = {};
for (const l of LANGS) keysets[l] = Object.keys(locales[l] ?? {}).sort();
const reference = keysets.en ?? [];

check(
  `key counts equal (en=${reference.length} ar=${keysets.ar?.length} fr=${keysets.fr?.length} kab=${keysets.kab?.length})`,
  LANGS.every((l) => keysets[l]?.length === reference.length)
);

for (const l of LANGS.filter((x) => x !== "en")) {
  const missing = reference.filter((k) => !(k in (locales[l] ?? {})));
  const extra = (keysets[l] ?? []).filter((k) => !reference.includes(k));
  check(`${l} has no missing/extra keys vs en`, missing.length === 0 && extra.length === 0,
    `missing=${missing.slice(0, 5).join(",")} extra=${extra.slice(0, 5).join(",")}`);
}

for (const l of LANGS) {
  const bad = Object.entries(locales[l] ?? {}).filter(([, v]) => typeof v === "string" && v.includes("\uFFFD"));
  check(`${l} has no U+FFFD in values`, bad.length === 0, bad.map(([k]) => k).slice(0, 5).join(","));
}

// read directly by page.tsx / TeacherDashboard.tsx; if one disappears the UI
// renders the raw key name on screen instead of translated text.
for (const k of ["loading", "teacher_no_sections"]) {
  check(`required key "${k}" in all languages`,
    LANGS.every((l) => typeof locales[l]?.[k] === "string" && locales[l][k].length > 0));
}

// ---------- 2. encoding ----------
console.log("=== source encoding ===");
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry !== "node_modules" && entry !== ".next") walk(p, out);
    } else if (/\.(ts|tsx|json|css|md)$/.test(entry)) out.push(p);
  }
  return out;
}

const files = walk(join(ROOT, "src"));
// Guards against the scan matching nothing, which would make every encoding
// assertion below pass vacuously.
const includedLocales = files.some((f) => f.endsWith("locales.json"));
const includedPage = files.some((f) => f.endsWith("page.tsx"));
check(`scanned source files (${files.length})`, files.length >= 30 && includedLocales && includedPage,
  `count=${files.length} locales.json=${includedLocales} page.tsx=${includedPage}`);

let replCount = 0;
let mojibakeCount = 0;
const badFiles = [];
// Symptom of UTF-8 bytes decoded as CP1252/Latin-1: "Ã©" for "é", "â€™" for "’".
const mojibake = /Ã[\x80-\xBF]|â€[-]|ðŸ/;
for (const f of files) {
  const text = readFileSync(f, "utf8");
  const hasRepl = text.includes("\uFFFD");
  const hasMojibake = mojibake.test(text);
  if (hasRepl) replCount += 1;
  if (hasMojibake) mojibakeCount += 1;
  if (hasRepl || hasMojibake) badFiles.push(f.split(sep).join("/").replace(ROOT.split(sep).join("/") + "/", ""));
}
check(`no replacement chars (U+FFFD)`, replCount === 0, badFiles.join(", "));
check(`no mojibake sequences`, mojibakeCount === 0, badFiles.join(", "));

// ---------- 3. production smoke ----------
console.log("=== production smoke ===");
const PORT = process.env.VERIFY_PORT ? Number(process.env.VERIFY_PORT) : 3199;
const require = createRequire(join(ROOT, "package.json"));
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", String(PORT)], {
  cwd: ROOT,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d.toString()));
server.stderr.on("data", (d) => (serverLog += d.toString()));

async function waitFor(path, expectStatus, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  let last = "no response";
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (r.status === expectStatus) return { ok: true, status: r.status, text: await r.text() };
      last = `status=${r.status}`;
    } catch (err) {
      last = String(err).slice(0, 60);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return { ok: false, status: 0, text: "", last };
}

try {
  const home = await waitFor("/", 200);
  check("GET / -> 200", home.ok, home.last);
  if (home.ok) check("home page has rendered markup", home.text.includes("<div") && home.text.length > 500, `len=${home.text.length}`);

  const sync = await waitFor("/api/sync", 200);
  check("GET /api/sync -> 200", sync.ok, sync.last);
  if (sync.ok) {
    let isJson = false;
    try { JSON.parse(sync.text); isJson = true; } catch { /* not json */ }
    check("sync response is JSON", isJson, sync.text.slice(0, 80));
    check("sync response leaks no auth_codes", !sync.text.includes("auth_codes"));
    check("sync response leaks no code_hash", !sync.text.includes("code_hash"));
  }

  // A validation failure forces route compilation without issuing a code.
  const bad = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) };
  const r1 = await fetch(`http://127.0.0.1:${PORT}/api/auth/send-code`, bad);
  check("POST /api/auth/send-code (bad body) -> 400", r1.status === 400, `status=${r1.status}`);
  const r2 = await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-code`, bad);
  check("POST /api/auth/verify-code (bad body) -> 400", r2.status === 400, `status=${r2.status}`);

  // A 404 on a referenced chunk is the classic symptom of a half-written .next.
  const html = await (await fetch(`http://127.0.0.1:${PORT}/`)).text();
  const chunks = html.match(/\/_next\/static\/[^"]+\.js/g) ?? [];
  check(`page references static chunks (${chunks.length})`, chunks.length > 0, html.slice(0, 200));
  if (chunks.length) {
    const first = await fetch(`http://127.0.0.1:${PORT}${chunks[0]}`);
    check("first static chunk -> 200", first.status === 200, `${chunks[0]} status=${first.status}`);
  }
} finally {
  server.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 1000));
  if (server.exitCode === null) server.kill("SIGKILL");
}

console.log(`\n${failures.length === 0 ? "PASS" : "FAIL"} - ${failures.length} failed`);
if (failures.length) {
  console.log("failed: " + failures.join(" | "));
  if (serverLog) console.log("server log tail:\n" + serverLog.slice(-800));
  process.exit(1);
}