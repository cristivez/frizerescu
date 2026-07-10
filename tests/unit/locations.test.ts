import { describe, expect, it } from "vitest";
import { locations, verifiedTotals, isOpenSpec } from "@/data/locations";

describe("locations data", () => {
  it("has exactly the three shops", () => {
    expect(locations.map((l) => l.slug).sort()).toEqual([
      "kaufland-mega-mall",
      "kaufland-pipera",
      "pipera",
    ]);
  });

  it("stores each review count exactly once (no duplicated literals)", () => {
    // The regression this guards: the old site hard-coded 4364 in three places.
    const counts = locations.map((l) => l.reviewCount);
    expect(new Set(counts).size).toBe(counts.length);
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
