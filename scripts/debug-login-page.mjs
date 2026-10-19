// Diagnostic: loads the app in a real browser and reports exactly what is on
// screen, so a failing login test can be told apart from a page that never
// finished booting. Not part of the gate; run manually.
//   node scripts/debug-login-page.mjs [port]
import { spawn, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TEMP_BROWSER = "C:/Users/anouar/AppData/Local/Temp/opencode/browser/node_modules";
const PORT = Number(process.argv[2] ?? 3155);

function resolvePlaywright() {
  for (const c of [join(ROOT, "node_modules", "playwright-core"), join(TEMP_BROWSER, "playwright-core")]) {
    if (existsSync(join(c, "package.json"))) return c;
  }
  return null;
}
const pw = resolvePlaywright();
if (!pw) { console.error("playwright-core not found"); process.exit(2); }
const { chromium } = createRequire(join(pw, "package.json"))("playwright-core");

function killTree(pid) {
  try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* gone */ }
}

const server = spawn("npm.cmd", ["run", "dev", "--", "-p", String(PORT)], {
  cwd: ROOT, shell: true, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));

const base = `http://${process.env.PROBE_HOST || "localhost"}:${PORT}`;
let browser;
try {
  for (let i = 0; i < 90; i += 1) {
    if (server.exitCode !== null) break;
    try { if ((await fetch(base, { signal: AbortSignal.timeout(3000) })).ok) break; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 1000));
  }

  browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Cut external requests so a slow fonts.googleapis.com stylesheet cannot add
  // jitter between runs. This was NOT the cause of the hydration stall - the
  // host was; see the `base` definition.
  const BLOCK_EXTERNAL = process.env.PROBE_BLOCK_EXTERNAL !== "0";
  if (BLOCK_EXTERNAL) {
    await ctx.route("**/*", (route) => {
      const u = route.request().url();
      if (u.includes("127.0.0.1") || u.includes("localhost") || u.startsWith("data:")) return route.continue();
      return route.abort();
    });
  }
  const page = await ctx.newPage();

  const errs = [];
  const traffic = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  page.on("console", (m) => traffic.push(`console[${m.type()}] ${m.text().slice(0, 220)}`));
  page.on("requestfailed", (r) => errs.push("requestfailed: " + r.url() + " " + (r.failure()?.errorText ?? "")));
  page.on("request", (r) => traffic.push(`> ${r.method()} ${r.url().slice(0, 150)}`));
  page.on("response", (r) => traffic.push(`< ${r.status()} ${r.url().slice(0, 150)}`));

  // Runs before any page script: records every fetch the app itself makes and
  // every uncaught error/rejection, so "the effect never ran" can be told apart
  // from "the effect ran and the fetch never left the page".
  await page.addInitScript(() => {
    const w = window;
    w.__fetches = [];
    w.__werrs = [];
    const orig = w.fetch;
    w.fetch = function (input) {
      w.__fetches.push({ url: String(typeof input === "string" ? input : (input && input.url) || input), at: Date.now() });
      return orig.apply(this, arguments);
    };
    w.addEventListener("error", (e) => w.__werrs.push("error: " + (e.message || e.type)));
    w.addEventListener("unhandledrejection", (e) => w.__werrs.push("rejection: " + String(e.reason).slice(0, 300)));
  });

  await page.goto(base, { waitUntil: "domcontentloaded" });

  // Poll once a second so the exact moment the loading screen clears (or the
  // fact that it never does) is visible, instead of three coarse snapshots.
  const t0 = Date.now();
  let clearedAt = null;
  for (let i = 0; i < 30; i += 1) {
    const snap = await page.evaluate(() => ({
      loading: !!document.querySelector('[data-testid="app-loading"]'),
      email: document.querySelectorAll('input[type="email"]').length,
      password: document.querySelectorAll('input[type="password"]').length,
      forms: document.forms.length,
      text: document.body.innerText.replace(/\s+/g, " ").slice(0, 200),
    }));
    if (!snap.loading && clearedAt === null) {
      clearedAt = Date.now() - t0;
      console.log(`\nloading cleared after ${clearedAt}ms -> ${JSON.stringify(snap)}`);
    }
    if (snap.email > 0) {
      console.log(`login form present after ${Date.now() - t0}ms`);
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (clearedAt === null) console.log(`\nloading NEVER cleared within 75s`);
  if (clearedAt !== null) {
    const final = await page.evaluate(() => ({
      email: document.querySelectorAll('input[type="email"]').length,
      forms: document.forms.length,
      text: document.body.innerText.replace(/\s+/g, " ").slice(0, 250),
    }));
    console.log("final: " + JSON.stringify(final, null, 1));
  }

  console.log("\n--- errors ---");
  console.log(errs.length ? errs.slice(0, 20).join("\n") : "(none)");

  const probe = await page.evaluate(() => ({
    fetches: (window).__fetches ?? "(init script did not run)",
    werrs: (window).__werrs ?? [],
    nextFlightPushes: (window).__next_f ? (window).__next_f.length : -1,
    bodyLen: document.body.innerHTML.length,
    hasReactRoot: !!document.querySelector("[data-reactroot]") || !!document.body.firstElementChild,
    htmlHead: document.body.innerHTML.slice(0, 160),
  }));
  console.log("\n--- in-page probe ---");
  console.log(JSON.stringify(probe, null, 1));

  console.log("\n--- traffic (first 60 lines) ---");
  console.log(traffic.slice(0, 60).join("\n") || "(no requests at all)");
} finally {
  if (browser) await browser.close().catch(() => {});
  // Kill by port: `npm.cmd` with shell:true gives a cmd.exe pid, and taskkill
  // on that tree has been seen to take down the parent shell instead of next.
  try {
    const out = execSync(
      `netstat -ano -p tcp | findstr LISTENING | findstr :${PORT}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    for (const line of out.split(/\r?\n/)) {
      const m = line.trim().match(/^\S+\s+\d[\d.]+:'?[\d.]+'?\s+\d+\s+\d+\s+(\d+)/) || line.trim().split(/\s+/).pop();
      const pid = Number(m);
      if (pid > 0) { try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* gone */ } }
    }
  } catch { /* nothing listening */ }
  killTree(server.pid);
}