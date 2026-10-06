// Audits the live database after a test run. Run with `node scripts/audit-db.mjs`.
//
// Reports bloom_state contents, auth_codes row count, and flags two things
// that have actually gone wrong here before:
//   - empty tombstones. In this sync protocol an empty value is a DELETE
//     instruction, so a leftover "" is a pending wipe of every client's copy
//     of that key.
//   - auth material reachable through GET /api/sync, which returns every row
//     of bloom_state to any caller.
//
// Exits non-zero if the database is not in its expected state.
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, "package.json"));

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

const env = readEnvFile();
if (!env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL not parsed from .env.local");
  process.exit(1);
}
const { neon } = require("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);

// Rows the application itself legitimately owns.
const APP_ROWS = new Set(["bloom_registered_users", "bloom_storage_version", "bloom_theme_mode"]);
const problems = [];

const state = await sql`SELECT id, value FROM bloom_state ORDER BY id`;
console.log(`bloom_state (${state.length} rows):`);
for (const r of state) {
  const v = String(r.value);
  console.log(`   ${r.id} = ${JSON.stringify(v.slice(0, 70))}`);
  if (v === "" && r.id !== "bloom_theme_mode") {
    problems.push(`empty tombstone on ${r.id} (pending delete of that key on every client)`);
  }
  if (/^(auth|code|otp|verification)/i.test(r.id)) {
    problems.push(`${r.id} is reachable via GET /api/sync`);
  }
}

const unexpected = state.filter((r) => !APP_ROWS.has(r.id));
if (unexpected.length) problems.push(`unexpected keys: ${unexpected.map((r) => r.id).join(", ")}`);

const codes = (await sql`SELECT count(*)::int AS n FROM auth_codes`)[0].n;
console.log(`auth_codes rows: ${codes}`);
if (codes !== 0) problems.push(`${codes} leftover auth_codes row(s) - test fixtures not cleaned up`);

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;
console.log(`tables: ${tables.map((t) => t.table_name).join(", ")}`);

if (problems.length) {
  console.log("\nFAIL");
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
}
console.log("\nPASS - database clean");