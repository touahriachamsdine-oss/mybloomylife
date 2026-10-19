// Prints the identity fields (email, name, role) stored in the shared
// bloom_registered_users row. Never prints salt or password material.
//   node scripts/list-demo-accounts.mjs
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, "package.json"));

function readEnvFile() {
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

const rows = await sql`SELECT value FROM bloom_state WHERE id = 'bloom_registered_users'`;
if (!rows.length) {
  console.log("no bloom_registered_users row");
  process.exit(0);
}

let users;
try {
  users = JSON.parse(rows[0].value);
} catch {
  console.error("FAIL - bloom_registered_users is not valid JSON");
  process.exit(1);
}
if (!Array.isArray(users)) {
  console.error("FAIL - bloom_registered_users is not an array");
  process.exit(1);
}

console.log(`${users.length} account(s) in the shared store:\n`);
for (const u of users) {
  const email = typeof u?.email === "string" ? u.email : "(no email)";
  const name = typeof u?.name === "string" ? u.name : "(no name)";
  const role = typeof u?.role === "string" ? u.role : "(no role)";
  console.log(`  ${role.padEnd(13)} ${email.padEnd(32)} ${name}`);
}

const testAccounts = users.filter(
  (u) => typeof u?.email === "string" && u.email.startsWith("test.")
);
console.log(
  `\nper-role test accounts present: ${testAccounts.length}/5`
);
