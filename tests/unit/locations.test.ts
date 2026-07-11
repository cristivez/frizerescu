import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { locations, verifiedTotals, totalsFrom, isOpenSpec, type Location } from "@/data/locations";

/** Recursively collect .ts/.tsx/.json files under `dir`. */
function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (/\.(ts|tsx|json)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("locations data", () => {
  it("has exactly the three shops", () => {
    expect(locations.map((l) => l.slug).sort()).toEqual([
      "kaufland-mega-mall",
      "kaufland-pipera",
      "pipera",
    ]);
  });

  /**
   * Build a regex that matches a standalone number token: not preceded/followed
   * by a digit or decimal (so 1025, 1.25 aren't matches), and not a CSS
   * measurement like "44px" (the 44px minimum touch target recurs in design
   * comments and is never a review count).
   */
  const literalRe = (lit: string) =>
    new RegExp(String.raw`(?<![\d.])${lit}(?!px|[\d.])`);

  it("no review count is hard-coded outside src/data/locations.ts", () => {
    // The regression this guards: the old site hard-coded review counts
    // (e.g. 4364) in three separate places, two of which went stale by
    // 600+ reviews. A test that only checks the three counts in
    // locations.ts differ from each other (true by construction) cannot
    // catch that — so this scans the actual source tree for the literals.
    const projectRoot = resolve(__dirname, "..", "..");
    const locationsFile = resolve(projectRoot, "src", "data", "locations.ts");
    // The logo is stored as SVG path data — coordinates like "L44 311.091" that
    // collide with a small review count (44) but are never counts. Both the
    // shared path constant and the inline Logo SVG are excluded, like
    // locations.ts itself.
    const svgFiles = new Set([
      resolve(projectRoot, "src", "components", "ui", "logo-path.ts"),
      resolve(projectRoot, "src", "components", "ui", "Logo.tsx"),
    ]);
    const forbidden = locations.map((l) => String(l.reviewCount));

    const files = [
      ...collectFiles(resolve(projectRoot, "src")),
      ...collectFiles(resolve(projectRoot, "messages")),
    ];

    const offenses: string[] = [];
    for (const file of files) {
      if (resolve(file) === locationsFile) continue;
      if (svgFiles.has(resolve(file))) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      for (const literal of forbidden) {
        // Matches a standalone number token: rejects when preceded/followed
        // by a digit or decimal point (so 1025, 1.25, 0.25, v0.25.0 are not matches).
        const re = literalRe(literal);
        lines.forEach((line, i) => {
          if (re.test(line)) {
            offenses.push(
              `${relative(projectRoot, file)}:${i + 1}: contains review-count literal "${literal}"`,
            );
          }
        });
      }
    }

    expect(offenses, offenses.join("\n")).toEqual([]);
  });

  it("regex rejects number tokens adjacent to digits or decimals", () => {
    const re = literalRe("25");

    // Should NOT match when adjacent to digit or decimal point
    expect(re.test("1025")).toBe(false);
    expect(re.test("1.25")).toBe(false);
    expect(re.test("0.25")).toBe(false);
    expect(re.test("transition: 0.25s")).toBe(false);
    expect(re.test("v0.25.0")).toBe(false);
    expect(re.test("250")).toBe(false);
    expect(re.test("gap: 25px")).toBe(false); // a CSS measurement, not a count

    // Should match when it's a standalone token
    expect(re.test("reviewCount: 25")).toBe(true);
    expect(re.test("(25 recenzii)")).toBe(true);
    expect(re.test("25")).toBe(true);
  });

  it("totals only the locations whose counts were actually verified", () => {
    const verified = locations.filter((l) => l.reviewsVerifiedOn !== null);
    const { reviews, locations: n } = verifiedTotals();
    expect(reviews).toBe(verified.reduce((s, l) => s + l.reviewCount, 0));
    // All three shops still exist even if one count is unverified.
    expect(n).toBe(3);
  });

  it("computes a review-weighted average rating, not a naive mean", () => {
    const verified = locations.filter((l) => l.reviewsVerifiedOn !== null);
    const weighted =
      verified.reduce((s, l) => s + l.rating * l.reviewCount, 0) /
      verified.reduce((s, l) => s + l.reviewCount, 0);
    expect(verifiedTotals().rating).toBeCloseTo(weighted, 4);
  });

  it("weights the rating by review count, not a naive mean of the ratings", () => {
    // On the real data, totalsFrom returns the review-weighted mean.
    const verified = locations.filter((l) => l.reviewsVerifiedOn !== null);
    const weighted =
      verified.reduce((s, l) => s + l.rating * l.reviewCount, 0) /
      verified.reduce((s, l) => s + l.reviewCount, 0);
    expect(totalsFrom(locations).rating).toBeCloseTo(weighted, 4);

    // Prove the weighting is genuine on a divergent fixture — the real ratings
    // are now all ~5.0, too close to tell a weighted mean from a naive one. A
    // naive mean of the fixture would be 3.0; the 1000-review shop must dominate.
    const fixture: Location[] = [
      { ...locations[0], rating: 5.0, reviewCount: 1000, reviewsVerifiedOn: "2026-01-01" },
      { ...locations[0], rating: 1.0, reviewCount: 1, reviewsVerifiedOn: "2026-01-01" },
    ];
    expect(totalsFrom(fixture).rating).toBeGreaterThan(4.9);
  });

  it("totalsFrom() throws rather than dividing by zero when nothing is verified", () => {
    expect(() => totalsFrom([])).toThrow(
      /no location has a verified review count/,
    );

    const allUnverified: Location[] = locations.map((l) => ({
      ...l,
      reviewsVerifiedOn: null,
    }));
    expect(() => totalsFrom(allUnverified)).toThrow(
      /no location has a verified review count/,
    );
  });

  it("uses E.164 phone numbers so tel: links work abroad", () => {
    for (const l of locations) expect(l.phone).toMatch(/^\+40\d{9}$/);
  });

  it("points every booking link at the right MERO page", () => {
    expect(locations.find((l) => l.slug === "pipera")!.meroUrl).toBe(
      "https://mero.ro/p/frizerescu",
    );
    expect(locations.find((l) => l.slug === "kaufland-pipera")!.meroUrl).toBe(
      "https://mero.ro/p/frizerescu-kaufland",
    );
    expect(locations.find((l) => l.slug === "kaufland-mega-mall")!.meroUrl).toBe(
      "https://mero.ro/p/frizerescu-kaufland-mega-mall",
    );
  });

  it("covers all seven weekdays exactly once per location", () => {
    for (const l of locations) {
      const days = l.hours.flatMap((h) => h.days);
      expect(days.length).toBe(7);
      expect(new Set(days).size).toBe(7);
    }
  });

  it("keeps every hours group a contiguous, ordered run of weekdays", () => {
    // The UI renders each group as "first – last" (dayRange in LocationCard
    // and the location page). A non-contiguous or unordered set — e.g.
    // Mon/Wed/Fri — would silently mislabel as "Monday – Friday". Guard the
    // DATA here, which is cheaper than generalizing the renderer.
    const WEEK_ORDER = [
      "Monday", "Tuesday", "Wednesday", "Thursday",
      "Friday", "Saturday", "Sunday",
    ];
    for (const l of locations) {
      for (const h of l.hours) {
        const indices = h.days.map((d) => WEEK_ORDER.indexOf(d));
        for (let i = 1; i < indices.length; i++) {
          expect(indices[i], `${l.slug}: ${h.days.join(",")}`).toBe(indices[i - 1] + 1);
        }
      }
    }
  });

  it("gives open specs a valid HH:MM range", () => {
    for (const l of locations) {
      for (const h of l.hours) {
        if (!isOpenSpec(h)) continue;
        expect(h.opens).toMatch(/^\d{2}:\d{2}$/);
        expect(h.closes).toMatch(/^\d{2}:\d{2}$/);
        expect(h.opens < h.closes).toBe(true);
      }
    }
  });
});
