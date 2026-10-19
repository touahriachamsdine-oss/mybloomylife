// Plain-HTTP probe: is `next dev` itself serving, or is this a browser/HMR
// problem? No browser involved, so it separates the two cleanly.
//   node scripts/probe-dev.mjs [port]
import { spawn, execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2] ?? 3156);

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

const server = spawn("npm.cmd", ["run", "dev", "--", "-p", String(PORT)], {
  cwd: ROOT, shell: true, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));

const base = `http://127.0.0.1:${PORT}`;
const time = async (label, fn) => {
  const t = Date.now();
  try {
    const r = await fn();
    console.log(`  ${label}: ${r.status} in ${Date.now() - t}ms`);
    return r;
  } catch (e) {
    console.log(`  ${label}: THREW after ${Date.now() - t}ms - ${String(e).slice(0, 140)}`);
    return null;
  }
};

try {
  let up = false;
  for (let i = 0; i < 90; i += 1) {
    if (server.exitCode !== null) break;
    try { if ((await fetch(base, { signal: AbortSignal.timeout(3000) })).ok) { up = true; break; } } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!up) throw new Error("dev server never came up:\n" + log.slice(-900));
  console.log(`dev server up on ${PORT}\n`);

  console.log("first requests (route compilation happens here):");
  await time("GET /            ", () => fetch(base, { signal: AbortSignal.timeout(60000) }));
  await time("GET /api/sync    ", async () => {
    const r = await fetch(`${base}/api/sync`, { signal: AbortSignal.timeout(60000) });
    const body = await r.text();
    console.log(`       body: ${body.slice(0, 160)}`);
    return r;
  });
  await time("GET / again      ", () => fetch(base, { signal: AbortSignal.timeout(60000) }));
  await time("GET /api/sync #2 ", () => fetch(`${base}/api/sync`, { signal: AbortSignal.timeout(60000) }));

  const html = await (await fetch(base)).text();
  console.log(`\nSSR html: ${html.length} bytes; contains app-loading marker: ${html.includes("app-loading")}`);

  console.log("\n--- server log tail ---");
  console.log(log.slice(-1200));
} finally {
  killByPort(PORT);
}