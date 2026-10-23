// Smoke test for the BUILT Worker (worker/index.ts + .open-next), run between
// `opennextjs-cloudflare build` and `deploy`. `next dev` and the Playwright suite never
// go through the custom entry, so this is the only automated check that the bot filter
// is wired in front of Next and that real pages still reach it.
// Usage: node scripts/worker-smoke.mjs   (needs a fresh `opennextjs-cloudflare build`)
import { spawn } from "node:child_process";

const checks = [
  // Real pages and metadata routes: must reach Next and succeed.
  ...["/", "/en", "/pipera", "/en/kaufland-mega-mall", "/kaufland-otopeni"].map((path) => ({
    path,
    status: 200,
    type: "text/html",
  })),
  { path: "/robots.txt", status: 200 },
  { path: "/sitemap.xml", status: 200 },
  { path: "/icon.png", status: 200 },
  // A human typo: must still get the styled 404 page, not the bare one. The Worker
  // serves it without Next, so it carries no scripts.
  { path: "/contact", status: 404, type: "text/html", contains: "Pagina nu există", noScripts: true },
  { path: "/en/nu-exista", status: 404, type: "text/html", contains: "Page not found", noScripts: true },
  { path: "/static-404", status: 404, type: "text/html", contains: "Pagina nu există" },
  // Scanner probes: the filter answers before Next boots.
  { path: "/login", status: 404, body: "Not Found" },
  { path: "/.git/config", status: 404, body: "Not Found" },
  { path: "/wp-login.php", status: 404, body: "Not Found" },
  { path: "/Dockerfile", status: 404, body: "Not Found" },
  { path: "/docker-compose", status: 404, body: "Not Found" },
  { path: "/aws-exports.js", status: 404, body: "Not Found" },
  { path: "/", method: "POST", status: 405, body: "Method Not Allowed" },
];

// Same runtime `npm run preview` uses. (wrangler's unstable_startWorker API was tried
// first: on 2026-10-24 it failed to bundle .open-next with unresolved Node built-ins.)
const PORT = 8799;
const BASE = `http://localhost:${PORT}`;
const dev = spawn("npx", ["wrangler", "dev", "--port", String(PORT), "--log-level", "warn", "--show-interactive-dev-session=false"], {
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
let devOutput = "";
dev.stdout.on("data", (d) => (devOutput += d));
dev.stderr.on("data", (d) => (devOutput += d));

async function waitUntilUp() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (dev.exitCode !== null) throw new Error(`wrangler dev exited early:\n${devOutput}`);
    try {
      await fetch(`${BASE}/robots.txt`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`wrangler dev did not start within 120 s:\n${devOutput}`);
}

const failures = [];
try {
  await waitUntilUp();
  for (const c of checks) {
    const res = await fetch(`${BASE}${c.path}`, { method: c.method ?? "GET", redirect: "manual" });
    const body = await res.text();
    const label = `${c.method ?? "GET"} ${c.path}`;
    const problems = [];
    if (res.status !== c.status) problems.push(`status ${res.status}, want ${c.status}`);
    if (c.type && !(res.headers.get("content-type") ?? "").startsWith(c.type)) {
      problems.push(`content-type ${res.headers.get("content-type")}, want ${c.type}`);
    }
    if (c.contains && !body.includes(c.contains)) problems.push(`body lacks ${JSON.stringify(c.contains)}`);
    if (c.noScripts && /<script\b/.test(body)) problems.push("body has <script>");
    if (c.body !== undefined && body !== c.body) problems.push(`body ${JSON.stringify(body.slice(0, 40))}, want ${JSON.stringify(c.body)}`);
    console.log(`${problems.length ? "FAIL" : "ok  "} ${label}${problems.length ? ` — ${problems.join("; ")}` : ""}`);
    if (problems.length) failures.push(label);
  }
} finally {
  // Kill the whole process group (npx -> wrangler -> workerd), not just npx.
  try {
    process.kill(-dev.pid, "SIGTERM");
  } catch {
    // already gone
  }
}

if (failures.length) {
  console.error(`\nworker smoke: ${failures.length} of ${checks.length} checks failed`);
  process.exit(1);
}
console.log(`\nworker smoke: all ${checks.length} checks passed`);
