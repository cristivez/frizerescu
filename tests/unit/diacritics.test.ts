import { describe, expect, it } from "vitest";
import { locations } from "@/data/locations";
import { services } from "@/data/services";
import { reviews } from "@/data/reviews";
import { faq } from "@/data/faq";
import { upcomingLocations } from "@/data/upcoming-locations";
import ro from "../../messages/ro.json";

// Romanian takes comma-below: ș U+0219, ț U+021B.
// The Turkish cedilla forms ş U+015F, ţ U+0163 are a different letter and
// render wrong (or not at all) in a latin-ext subset.
const CEDILLA = /[şţŞŢ]/;

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

describe("Romanian diacritics", () => {
  it.each([
    ["messages/ro.json", ro],
    ["data/locations", locations],
    ["data/services", services],
    ["data/reviews", reviews],
    ["data/faq", faq],
    ["data/upcoming-locations", upcomingLocations],
  ])("%s uses comma-below ș/ț, never the Turkish cedilla", (_name, source) => {
    const offenders = strings(source).filter((s) => CEDILLA.test(s));
    expect(offenders).toEqual([]);
  });
});
