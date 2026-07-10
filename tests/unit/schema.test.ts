import { describe, expect, it } from "vitest";
import { locations } from "@/data/locations";
import { hairSalonSchema, organizationSchema, breadcrumbSchema, salonId } from "@/lib/seo/schema";
import { localizedUrl, alternates } from "@/lib/seo/metadata";

describe("localizedUrl", () => {
  it("serves ro unprefixed and en under /en", () => {
    expect(localizedUrl("ro", "")).toBe("https://frizerescu.ro/");
    expect(localizedUrl("en", "")).toBe("https://frizerescu.ro/en");
    expect(localizedUrl("ro", "/pipera")).toBe("https://frizerescu.ro/pipera");
    expect(localizedUrl("en", "/pipera")).toBe("https://frizerescu.ro/en/pipera");
  });
});

describe("hairSalonSchema", () => {
  const pipera = locations.find((l) => l.slug === "pipera")!;
  const schema = hairSalonSchema(pipera, "ro") as Record<string, any>;

  it("is a HairSalon whose url is its OWN page, not the homepage", () => {
    // The bug in the old site: all three schemas claimed url = "https://frizerescu.ro/".
    expect(schema["@type"]).toBe("HairSalon");
    expect(schema.url).toBe("https://frizerescu.ro/pipera");
  });

  it("emits one openingHoursSpecification per open block and omits closed days", () => {
    const specs = schema.openingHoursSpecification as any[];
    expect(specs).toHaveLength(2); // Mon-Fri, Sat. Sunday is closed -> omitted.
    expect(specs.flatMap((s) => s.dayOfWeek)).not.toContain("Sunday");
  });

  it("carries aggregateRating even though Google will not render stars for it", () => {
    // Self-serving reviews on LocalBusiness are ineligible for rich results
    // (Google, 2019). Kept because it still feeds AI Overviews.
    expect(schema.aggregateRating.ratingValue).toBe(4.99);
    expect(schema.aggregateRating.reviewCount).toBe(4988);
  });

  it("uses an E.164 telephone", () => {
    expect(schema.telephone).toBe("+40758720970");
  });
});

describe("organizationSchema", () => {
  it("links all three shops as subOrganization", () => {
    const org = organizationSchema("ro") as Record<string, any>;
    expect(org.subOrganization).toHaveLength(3);
  });

  it.each(["ro", "en"] as const)(
    "gives each subOrganization entry the SAME @id as that salon's own hairSalonSchema (%s)",
    (locale) => {
      const org = organizationSchema(locale) as Record<string, any>;
      for (const loc of locations) {
        const ownSchema = hairSalonSchema(loc, locale) as Record<string, any>;
        // Match by name, not array index — index coupling would hide a reordering bug.
        const subEntry = org.subOrganization.find(
          (s: any) => s.name === loc.name,
        );
        expect(subEntry).toBeDefined();
        expect(subEntry["@id"]).toBe(ownSchema["@id"]);
      }
    },
  );

  it("gives every subOrganization entry @type HairSalon and a matching name", () => {
    const org = organizationSchema("ro") as Record<string, any>;
    for (const loc of locations) {
      const subEntry = org.subOrganization.find(
        (s: any) => s.name === loc.name,
      );
      expect(subEntry).toBeDefined();
      expect(subEntry["@type"]).toBe("HairSalon");
      expect(subEntry.name).toBe(loc.name);
    }
  });
});

describe("salonId", () => {
  it("builds the stable node id from the localized URL plus #salon", () => {
    expect(salonId("ro", "pipera")).toBe("https://frizerescu.ro/pipera#salon");
    expect(salonId("en", "pipera")).toBe(
      "https://frizerescu.ro/en/pipera#salon",
    );
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions from 1", () => {
    const bc = breadcrumbSchema("ro", [
      { name: "Acasă", path: "" },
      { name: "Frizerescu Pipera", path: "/pipera" },
    ]) as Record<string, any>;
    expect(bc.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
});

describe("alternates", () => {
  it("builds canonical + hreflang links for the homepage", () => {
    expect(alternates("")).toEqual({
      canonical: "https://frizerescu.ro/",
      languages: {
        ro: "https://frizerescu.ro/",
        en: "https://frizerescu.ro/en",
        "x-default": "https://frizerescu.ro/",
      },
    });
  });

  it("builds canonical + hreflang links for a location page", () => {
    const result = alternates("/pipera");
    expect(result.canonical).toBe("https://frizerescu.ro/pipera");
    expect(result.languages.en).toBe("https://frizerescu.ro/en/pipera");
    expect(result.languages["x-default"]).toBe("https://frizerescu.ro/pipera");
  });
});
