import { describe, expect, it } from "vitest";
import { getUpcomingLocation, upcomingLocations } from "@/data/upcoming-locations";

describe("upcomingLocations", () => {
  it("has at least the Otopeni entry with both locales filled", () => {
    const otopeni = getUpcomingLocation("kaufland-otopeni");
    expect(otopeni).toBeDefined();
    expect(otopeni!.name).toBe("Frizerescu Kaufland Otopeni");
    for (const l of upcomingLocations) {
      for (const field of [l.landmark, l.opening, l.intro]) {
        expect(field.ro.length).toBeGreaterThan(0);
        expect(field.en.length).toBeGreaterThan(0);
      }
      expect(l.followUrl).toContain("instagram.com");
      expect(typeof l.geo.lat).toBe("number");
    }
  });

  it("shares no slug with the open locations (isolation)", async () => {
    const { locations } = await import("@/data/locations");
    const open = new Set(locations.map((l) => l.slug));
    for (const l of upcomingLocations) expect(open.has(l.slug as never)).toBe(false);
  });
});
