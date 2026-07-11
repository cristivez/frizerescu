import { test, expect } from "@playwright/test";

// NOTE: installed @playwright/test 1.61.1's `_combinedContextOptions` fixture
// (node_modules/playwright/lib/index.js) only destructures a fixed list of
// named context-option fixtures (colorScheme, viewport, locale, ...) into the
// context it builds — `reducedMotion` is not among them, so the shorthand
// `test.use({ reducedMotion: "reduce" })` is silently dropped and the browser
// falls back to its default (no-preference), which does NOT disable the
// animation. Verified empirically: `browser.newContext({ reducedMotion })`
// called directly (bypassing the fixture) applies correctly, and wrapping the
// value in `contextOptions` — which IS spread verbatim into the merged
// options — restores it. See task-6-report.md for the full investigation.
test.use({ contextOptions: { reducedMotion: "reduce" } });

// All three assertions below key off GSAP's fingerprint — the inline styles
// (or, for CountUp, the DOM writes) it authors when a tween actually runs —
// rather than on timing. Under a working `matchMedia` guard the animation
// never runs at all, so these are deterministic facts, not races:
//   - Reveal / RazorWipe: gsap.from() with the default `immediateRender: true`
//     writes the tween's starting values onto `el.style` synchronously the
//     moment it's created. If the guard holds, gsap.from() is never called,
//     so `el.style` carries none of GSAP's properties, ever.
//   - CountUp: a running tween writes `el.textContent` at least twice (once
//     to "0", then on every `onUpdate`) — the *first* of those two writes
//     happens synchronously on mount, before any scroll-trigger or tween
//     duration is involved, so there is no wait/timeout to get right.

test("under reduced motion, revealed content carries no GSAP-authored inline style", async ({ page }) => {
  await page.goto("/");
  const revealed = page.locator("[data-reveal]").first();
  await expect(revealed).toBeVisible();
  const style = await revealed.evaluate((el) => {
    const target = el as HTMLElement;
    return {
      inlineOpacity: target.style.opacity,
      inlineTransform: target.style.transform,
      computedOpacity: getComputedStyle(target).opacity,
    };
  });
  // Empty inline style means gsap.from() never ran — the animation was
  // skipped entirely, not merely finished.
  expect(style.inlineOpacity).toBe("");
  expect(style.inlineTransform).toBe("");
  expect(Number(style.computedOpacity)).toBe(1);
});

test("under reduced motion, the razor wipe carries no GSAP-authored inline clip-path", async ({ page }) => {
  await page.goto("/");
  const wiped = page.locator("[data-razor-wipe]").first();
  const style = await wiped.evaluate((el) => {
    const target = el as HTMLElement;
    return {
      inlineClipPath: target.style.clipPath,
      computedClipPath: getComputedStyle(target).clipPath,
    };
  });
  expect(style.inlineClipPath).toBe("");
  expect(style.computedClipPath).toBe("none");
});

test("under reduced motion, the count-up never mutates its text", async ({ page }) => {
  // Installed before hydration (addInitScript runs before any of the page's
  // own scripts). We can't observe `[data-countup]` for mutations from time
  // zero, because the initial HTML-parser insertion of its SSR-rendered text
  // is itself a childList mutation — that's a parsing artifact, not a GSAP
  // write. So a root observer watches for the element's insertion, and only
  // *then* attaches a dedicated observer to it — meaning the recorded array
  // starts genuinely empty and only fills if something writes to the element
  // after that point, which is exactly what a running CountUp does.
  await page.addInitScript(() => {
    const w = window as unknown as { __countupMutations: string[] };
    w.__countupMutations = [];
    const attach = (target: Element) => {
      if ((target as unknown as { __countupObserved?: boolean }).__countupObserved) return;
      (target as unknown as { __countupObserved?: boolean }).__countupObserved = true;
      const observer = new MutationObserver((records) => {
        for (const record of records) w.__countupMutations.push(record.type);
      });
      observer.observe(target, { childList: true, characterData: true, subtree: true });
    };
    const root = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.matches("[data-countup]")) attach(el);
          el.querySelectorAll("[data-countup]").forEach((el2) => attach(el2));
        });
      }
    });
    root.observe(document, { childList: true, subtree: true });
  });

  await page.goto("/");
  const stat = page.locator("[data-countup]").first();
  await expect(stat).toBeVisible();

  const mutations = await page.evaluate(() => (window as unknown as { __countupMutations: string[] }).__countupMutations);
  // The real guard: under reduced motion the tween never runs, so CountUp never
  // mutates the text node. A broken guard records at least one mutation.
  expect(mutations).toEqual([]);
  // And the server-rendered final value stays put — a non-zero number, never the
  // "0" a running count-up would flash. Data-independent (no hard-coded total).
  await expect(stat).not.toHaveText("0");
  await expect(stat).toHaveText(/[1-9]/);
});
