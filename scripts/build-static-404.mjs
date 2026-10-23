// Turns the prerendered /static-404 pages into .open-next/static-404.mjs, which the
// custom Worker (worker/index.ts) imports and serves for unknown addresses.
// Run after `opennextjs-cloudflare build`, before wrangler bundles the Worker.
//
// Scripts are stripped: the HTML was prerendered for /static-404, and hydrating it at
// another address would make Next's router rewrite the address bar. The page is fully
// styled and usable without them (motion renders its final state server-side).
import { readFileSync, writeFileSync } from "node:fs";

const out = {};
for (const locale of ["ro", "en"]) {
  const file = `.next/server/app/${locale}/static-404.html`;
  const html = readFileSync(file, "utf8")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<link\b[^>]*\bas="script"[^>]*>/g, "")
    .replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, "");
  if (/<script\b/.test(html) || !html.includes(`<html lang="${locale}"`)) {
    throw new Error(`${file}: unexpected markup after stripping scripts`);
  }
  out[locale] = html;
}

writeFileSync(
  ".open-next/static-404.mjs",
  `export const ro = ${JSON.stringify(out.ro)};\nexport const en = ${JSON.stringify(out.en)};\n`,
);
console.log(`static 404: ro ${out.ro.length} B, en ${out.en.length} B`);
