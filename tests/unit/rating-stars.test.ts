import { describe, expect, it } from "vitest";
import { fillPercent } from "@/components/ui/RatingStars";

describe("fillPercent", () => {
  it("is 0 at value 0", () => {
    expect(fillPercent(0)).toBe(0);
  });

  it("is 50 at value 2.5 (half the row)", () => {
    expect(fillPercent(2.5)).toBe(50);
  });

  it("is 100 at value 5 (fully solid)", () => {
    expect(fillPercent(5)).toBe(100);
  });

  it("is ~99.8 at value 4.99 (a real partial fifth star, not rounded up)", () => {
    expect(fillPercent(4.99)).toBeCloseTo(99.8, 5);
  });

  it("clamps below 0 to 0", () => {
    expect(fillPercent(-1)).toBe(0);
  });

  it("clamps above 5 to 100", () => {
    expect(fillPercent(6)).toBe(100);
  });
});
