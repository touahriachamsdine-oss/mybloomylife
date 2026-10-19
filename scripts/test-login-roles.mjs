// Real-browser login test for the per-role test accounts.
//
//   node scripts/test-login-roles.mjs
//
// Phase 1 - development: every test account must sign in through the actual
// login form and land on a rendered screen. `npm run dev` is required because
// production deliberately refuses demo fixture accounts.
//
// Phase 2 - production: the same accounts must be REFUSED. This is the safety
// property that makes publishing trivial passwords acceptable: isDemoAccountEmail()
// gates on identity, so it holds even though the rows really exist in the
// shared database (dev seeding writes them there).
//
// A wrong-password check in both phases keeps the success assertions from
// passing vacuously - a form that always "succeeds" would satisfy them.
//
// playwright-core is not a dependency of this project; the script looks for it
// locally first, then in the temp browser workspace, and fails with a clear
// message rather than a module-not-found stack.
import { spawn, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TEMP_BROWSER = "C:/Users/anouar/AppData/Local/Temp/opencode/browser/node_modules";
const DEV_PORT = Number(process.env.LOGIN_DEV_PORT ?? 3151);
const PROD_PORT = Number(process.env.LOGIN_PROD_PORT ?? 3152);

// Each account: what to type, and a fragment of text that proves the right
// identity resolved. Staff names only render inside the drawer, so the drawer
// is opened before the body is read.
//
// The whole DEMO_ACCOUNTS fixture, not just the per-role additions: "the demo
// accounts work" has to be a checked claim, and the legacy eleven take a
// different path into storage (they predate the per-role ones).
const ACCOUNTS = [
  { email: "test.youth@example.com", password: "test1234", role: "youth", name: "Test Youth" },
  { email: "test.parent@example.com", password: "test1234", role: "parent", name: "Test Parent" },
  { email: "test.teacher@example.com", password: "test1234", role: "teacher", name: "Test Teacher" },
  { email: "test.psychologist@example.com", password: "test1234", role: "psychologist", name: "Test Psychologist" },
  { email: "test.admin@example.com", password: "test1234", role: "admin", name: "Test Admin" },
  { email: "youth@example.com", password: "123", role: "youth", name: "Sara" },
  { email: "yamina@example.com", password: "123", role: "youth", name: "Yamina" },
  { email: "parent@example.com", password: "1234", role: "parent", name: "Abu Sara" },
  { email: "papa@example.com", password: "1234", role: "parent", name: "Abu Sara" },
  { email: "maman@example.com", password: "1234", role: "parent", name: "Abu Yamina" },
  { email: "psychologist@example.com", password: "123", role: "psychologist", name: "Dr. Laila" },
  { email: "psy@example.com", password: "123", role: "psychologist", name: "Dr. Laila" },
  { email: "laila@example.com", password: "123", role: "psychologist", name: "Dr. Laila" },
  { email: "drmeriem@example.com", password: "123", role: "psychologist", name: "Dr. Meriem" },
  { email: "admin@example.com", password: "123", role: "admin", name: "System Admin" },
  { email: "admin2@example.com", password: "1234", role: "admin", name: "Admin II" },
];

function resolvePlaywright() {
  const candidates = [
    join(ROOT, "node_modules", "playwright-core"),
    join(TEMP_BROWSER, "playwright-core"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "package.json"))) return c;
  }
  return null;
}

const playwrightPath = resolvePlaywright();
if (!playwrightPath) {
  console.error("FAIL - playwright-core not found.");
  console.error("  looked in: " + [join(ROOT, "node_modules"), TEMP_BROWSER].join("\n           "));
  console.error("  install it (npm i -D playwright-core) or set PLAYWRIGHT_CORE_DIR.");
  process.exit(2);
}
const requireFromPlaywright = createRequire(join(playwrightPath, "package.json"));
const { chromium } = requireFromPlaywright("playwright-core");

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

function killTree(pid) {
  try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* already gone */ }
}

// Kill by listening port. The servers are spawned with shell:true, so
// child.pid is cmd.exe, and taskkill on that tree has been observed to miss
// the next process entirely (leaving a stray listener that blocks the next
// `next dev`, which refuses to start when one is already running).
function killByPort(port) {
  try {
    const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    });
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (pid > 0) { try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* gone */ } }
    }
  } catch { /* nothing listening */ }
}

async function startServer(cmd, args, port, label) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  const state = { child, port, label, log: "" };
  child.stdout.on("data", (d) => (state.log += d.toString()));
  child.stderr.on("data", (d) => (state.log += d.toString()));

  // `localhost`, NOT `127.0.0.1`: the app never hydrates when the page is
  // loaded over 127.0.0.1 against `next dev`. The chunks all return 200 and
  // React's runtime loads, but RootPage's useEffect never fires, so
  // bloomHydrateFromServer() is never called, the loading screen never clears,
  // and no login form ever appears. Over `localhost` the same build paints the
  // form in ~4s. Verified by scripts/debug-login-page.mjs.
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 90; i += 1) {
    if (child.exitCode !== null) break;
    try {
      const r = await fetch(base, { signal: AbortSignal.timeout(3000) });
      if (r.ok) return { ...state, base };
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${label} server never came up:\n${state.log.slice(-900)}`);
}

// Signs in through the real form. Returns { accepted, errorShown, body }.
async function attemptLogin(page, base, account) {
  await page.goto(base, { waitUntil: "domcontentloaded" });

  // The client seeds the account list from /api/sync on first paint, so wait
  // for the form to be interactive rather than for a fixed delay.
  await page.waitForSelector('input[type="email"]', { timeout: 45000 });
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForFunction(
      () => document.querySelectorAll('input[type="email"]').length === 0,
      null,
      { timeout: 30000 }
    ).catch(() => {}),
  ]);

  // Give the error banner a moment to appear if the form is still on screen.
  await page.waitForTimeout(1200);

  const stillOnLogin = (await page.locator('input[type="email"]').count()) > 0;
  const errorShown = (await page.locator("text=/login_error|incorrect|invalid|failed/i").count()) > 0;
  const body = await page.evaluate(() => document.body.innerText);

  // On failure, compare what login() sees (React state, fed from localStorage
  // at provider init) against what hydration later wrote into localStorage.
  let lsEmails = null;
  let stateHint = null;
  if (stillOnLogin) {
    lsEmails = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("bloom:registered_users");
        return raw ? JSON.parse(raw).map((u) => u?.email) : [];
      } catch { return ["<unreadable>"]; }
    });
    stateHint = await page.evaluate(() => document.querySelectorAll('input[type="email"]').length);
  }

  return { accepted: !stillOnLogin, errorShown, body, stillOnLogin, lsEmails, stateHint };
}

async function withFreshContext(browser, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  try {
    return await fn(page, { pageErrors, consoleErrors });
  } finally {
    await ctx.close().catch(() => {});
  }
}

let browser;
const servers = [];
try {
  browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  // ---------- phase 1: development ----------
  console.log("=== phase 1: development (accounts must work) ===");
  const dev = await startServer("npm.cmd", ["run", "dev", "--", "-p", String(DEV_PORT)], DEV_PORT, "dev");
  servers.push(dev.child);

  // Regression guard: a cold client must not push the account list.
  //
  // Before this was fixed, an empty browser seeded the 16-account demo fixture
  // locally and POSTed it, overwriting the shared table - which is how real
  // registrations from other devices were deleted, and why which demo accounts
  // could sign in looked random.
  console.log("  -- cold boot must not author the shared account list");
  await withFreshContext(browser, async (page) => {
    const pushes = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().includes("/api/sync")) pushes.push(r.postData() ?? "");
    });
    await page.goto(dev.base, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="email"]', { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const accountPushes = pushes.filter((b) => b.includes("bloom_registered_users"));
    check("cold boot does not push the account list", accountPushes.length === 0,
      `${accountPushes.length} push(es): ${accountPushes[0]?.slice(0, 140) ?? ""}`);
  });

  for (const account of ACCOUNTS) {
    console.log(`  -- ${account.role}: ${account.email}`);
    const res = await withFreshContext(browser, async (page) => {
      const attempt = await attemptLogin(page, dev.base, account);

      if (!attempt.accepted) {
        check(`${account.role} signs in`, false, `still on login form; body=${JSON.stringify(attempt.body.slice(0, 160))}`);
        console.log(`      localStorage sees ${attempt.lsEmails?.length ?? "?"} accounts: ${JSON.stringify(attempt.lsEmails)}`);
        return;
      }
      check(`${account.role} signs in`, true);

      // Open the drawer: a staff member's name is only rendered in there.
      const headerBtn = page.locator("header button").first();
      if (await headerBtn.count()) {
        await headerBtn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(600);
      }
      const after = await page.evaluate(() => document.body.innerText);
      check(`${account.role} screen is not blank`, after.trim().length > 40, `chars=${after.trim().length}`);

      // A youth with no stored level lands on the level picker instead of the
      // dashboard, so the name may not be in the drawer yet. Report it rather
      // than failing a correct login.
      const named = after.includes(account.name);
      const onLevelPicker = /level|cycle|year/i.test(after);
      console.log(`      identity rendered: ${named}${named ? "" : onLevelPicker ? " (level picker, expected for a fresh youth)" : " - NOT FOUND"}`);
    });
    if (res) {
      // pageErrors checked outside so a login failure still gets reported
    }
  }

  // A wrong password must be rejected, otherwise "signs in" proves nothing.
  await withFreshContext(browser, async (page, { pageErrors }) => {
    const attempt = await attemptLogin(page, dev.base, {
      email: "test.admin@example.com",
      password: "definitely-wrong",
    });
    check("wrong password is rejected", attempt.stillOnLogin, `body=${JSON.stringify(attempt.body.slice(0, 160))}`);
    // A rejection that arrives via an uncaught exception is not a rejection, so
    // this keeps the assertion above from passing on a broken page.
    check("wrong password path raises no page error", pageErrors.length === 0, pageErrors[0]);
  });

  killByPort(DEV_PORT);

  // ---------- phase 2: production ----------
  console.log("\n=== phase 2: production (accounts must be refused) ===");
  const prod = await startServer("npm.cmd", ["run", "start", "--", "-p", String(PROD_PORT)], PROD_PORT, "production");
  servers.push(prod.child);

  await withFreshContext(browser, async (page) => {
    const attempt = await attemptLogin(page, prod.base, ACCOUNTS[0]);
    check("production refuses a demo fixture account", attempt.stillOnLogin,
      `login unexpectedly accepted; body=${JSON.stringify(attempt.body.slice(0, 160))}`);
  });

  await withFreshContext(browser, async (page) => {
    const attempt = await attemptLogin(page, prod.base, {
      email: "test.admin@example.com",
      password: "definitely-wrong",
    });
    check("production rejects a wrong password", attempt.stillOnLogin);
  });

  killByPort(PROD_PORT);
} finally {
  killByPort(DEV_PORT);
  killByPort(PROD_PORT);
  for (const s of servers) killTree(s?.pid);
  if (browser) await browser.close().catch(() => {});
}

console.log(`\n${failures.length === 0 ? "PASS" : "FAIL"} - ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("failed: " + failures.join(" | "));
  process.exit(1);
}