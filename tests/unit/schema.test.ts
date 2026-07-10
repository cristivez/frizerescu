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
  it("is locale-neutral: one physical shop, one entity id (the ro URL)", () => {
    expect(salonId("pipera")).toBe("https://frizerescu.ro/pipera#salon");
  });

  it("both locales' hairSalonSchema name the SAME entity, with localized urls", () => {
    const pipera = locations.find((l) => l.slug === "pipera")!;
    const ro = hairSalonSchema(pipera, "ro") as Record<string, any>;
    const en = hairSalonSchema(pipera, "en") as Record<string, any>;
    // Same identity — splitting @id per locale would tell Google the two
    // pages describe different businesses.
    expect(ro["@id"]).toBe(en["@id"]);
    // Different page urls — each locale's node points at its own page.
    expect(ro.url).toBe("https://frizerescu.ro/pipera");
    expect(en.url).toBe("https://frizerescu.ro/en/pipera");
  });

  it("links the salon to its map and its parent organization", () => {
    const pipera = locations.find((l) => l.slug === "pipera")!;
    const schema = hairSalonSchema(pipera, "ro") as Record<string, any>;
    expect(schema.hasMap).toBe(pipera.mapsUrl);
    expect(schema.parentOrganization["@id"]).toBe("https://frizerescu.ro#org");
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
  it("builds canonical + hreflang links for the ro homepage", () => {
    expect(alternates("ro", "")).toEqual({
      canonical: "https://frizerescu.ro/",
      languages: {
        ro: "https://frizerescu.ro/",
        en: "https://frizerescu.ro/en",
        "x-default": "https://frizerescu.ro/",
      },
    });
  });

  it("self-canonicalizes each locale — the en page canonicals to ITSELF, not ro", () => {
    // The bug this guards: a shared canonical pointing every locale at the ro
    // URL drops the /en/* pages from Google's English index.
    expect(alternates("en", "").canonical).toBe("https://frizerescu.ro/en");
    expect(alternates("en", "/pipera").canonical).toBe("https://frizerescu.ro/en/pipera");
    expect(alternates("ro", "/pipera").canonical).toBe("https://frizerescu.ro/pipera");
  });

  it("keeps hreflang alternates and x-default (ro) locale-independent", () => {
    for (const locale of ["ro", "en"] as const) {
      const result = alternates(locale, "/pipera");
      expect(result.languages.ro).toBe("https://frizerescu.ro/pipera");
      expect(result.languages.en).toBe("https://frizerescu.ro/en/pipera");
      expect(result.languages["x-default"]).toBe("https://frizerescu.ro/pipera");
    }
  });
});
