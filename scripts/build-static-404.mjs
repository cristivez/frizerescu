// Writes .open-next/static-404.mjs for the custom Worker (worker/index.ts):
// - `ro`, `en`: the prerendered /static-404 pages, served for unknown addresses;
// - `pages`: every page path Next built, so the Worker's page list cannot drift from the app.
// Run after `opennextjs-cloudflare build` (it wipes .open-next), before wrangler bundles the
// Worker: `npm run build:worker`.
import { readFileSync, writeFileSync } from "node:fs";

const LOCALES = ["ro", "en"];
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

// --- Page list -----------------------------------------------------------------------
// Every page is prerendered (SSG), so the prerender manifest lists every real address,
// with its locale prefix: /ro, /en/pipera, …
const prerendered = Object.keys(readJson(".next/prerender-manifest.json").routes);
const localePrefix = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);
const pages = [
  ...new Set(
    prerendered
      .filter((p) => localePrefix.test(p))
      .map((p) => p.replace(localePrefix, ""))
      .filter((p) => p !== "/static-404"),
  ),
].sort();
if (!pages.includes("")) throw new Error("prerender manifest: no homepage, refusing to build");

// A page that renders only on demand has no prerendered path, so it would be missing from
// `pages` and 404 in production. Fail the build instead.
const NOT_PAGES = new Set(["/[locale]/[...rest]", "/[locale]/static-404"]);
for (const [entry, route] of Object.entries(readJson(".next/app-path-routes-manifest.json"))) {
  if (!entry.endsWith("/page") || route.startsWith("/_") || NOT_PAGES.has(route)) continue;
  const pattern = new RegExp(
    `^${route.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+")}$`,
  );
  if (!prerendered.some((p) => pattern.test(p))) {
    throw new Error(
      `${route} has no prerendered path, so the Worker would 404 it: prerender it ` +
        `(generateStaticParams) or let it through in worker/page-routes.ts`,
    );
  }
}

// --- 404 HTML --------------------------------------------------------------------------
// Rewrites a fragment that must occur exactly `count` times, so a markup change fails here
// instead of shipping a broken page.
function replaceExactly(html, from, to, count, file) {
  const found = html.split(from).length - 1;
  if (found !== count) throw new Error(`${file}: expected ${count}× ${JSON.stringify(from)}, found ${found}`);
  return html.replaceAll(from, to);
}

const out = {};
for (const locale of LOCALES) {
  const file = `.next/server/app/${locale}/static-404.html`;
  // Scripts are stripped: hydrating the page at another address would make Next's router
  // rewrite the address bar to /static-404. Motion renders its final state server-side.
  let html = readFileSync(file, "utf8")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<link\b[^>]*\bas="script"[^>]*>/g, "")
    .replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, "");
  // The language switcher links to this page in each locale; send it to that locale's home.
  for (const l of LOCALES) {
    const prefix = l === "ro" ? "" : `/${l}`; // as-needed: the default locale is unprefixed
    html = replaceExactly(html, `href="${prefix}/static-404"`, `href="${prefix || "/"}"`, 1, file);
  }
  // The mobile menu button cannot open without scripts: remove it rather than ship a dead
  // control. Phones keep the logo, the home button and the shop links in the page body.
  const menuButton = html.match(/<button type="button" aria-expanded="false"[^>]*>[\s\S]*?<\/button>/g) ?? [];
  if (menuButton.length !== 1) throw new Error(`${file}: expected 1 menu button, found ${menuButton.length}`);
  html = html.replace(menuButton[0], "");

  if (/<script\b|<button\b|static-404/.test(html) || !html.includes(`<html lang="${locale}"`)) {
    throw new Error(`${file}: unexpected markup after rewriting`);
  }
  out[locale] = html;
}

writeFileSync(
  ".open-next/static-404.mjs",
  LOCALES.map((l) => `export const ${l} = ${JSON.stringify(out[l])};\n`).join("") +
    `export const pages = ${JSON.stringify(pages)};\n`,
);
console.log(`static 404: ro ${out.ro.length} B, en ${out.en.length} B; pages: ${pages.map((p) => p || "/").join(" ")}`);
