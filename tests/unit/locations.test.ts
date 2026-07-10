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

  /** Helper: build a regex that matches a standalone number token (not preceded/followed by digit or decimal). */
  const literalRe = (lit: string) =>
    new RegExp(String.raw`(?<![\d.])${lit}(?![\d.])`);

  it("no review count is hard-coded outside src/data/locations.ts", () => {
    // The regression this guards: the old site hard-coded review counts
    // (e.g. 4364) in three separate places, two of which went stale by
    // 600+ reviews. A test that only checks the three counts in
    // locations.ts differ from each other (true by construction) cannot
    // catch that — so this scans the actual source tree for the literals.
    const projectRoot = resolve(__dirname, "..", "..");
    const locationsFile = resolve(projectRoot, "src", "data", "locations.ts");
    const forbidden = locations.map((l) => String(l.reviewCount));

    const files = [
      ...collectFiles(resolve(projectRoot, "src")),
      ...collectFiles(resolve(projectRoot, "messages")),
    ];

    const offenses: string[] = [];
    for (const file of files) {
      if (resolve(file) === locationsFile) continue;
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

  it("totalsFrom() on the real data returns the review-weighted rating, not a naive mean", () => {
    const verified = locations.filter((l) => l.reviewsVerifiedOn !== null);
    const naiveMean =
      verified.reduce((s, l) => s + l.rating, 0) / verified.length;
    const weighted =
      verified.reduce((s, l) => s + l.rating * l.reviewCount, 0) /
      verified.reduce((s, l) => s + l.reviewCount, 0);

    const { rating } = totalsFrom(locations);
    expect(rating).toBeCloseTo(weighted, 4);
    expect(rating).not.toBeCloseTo(naiveMean, 2);
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
