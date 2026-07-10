import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../../src/app/globals.css"), "utf8");

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  return m[1];
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("WCAG 2.1 contrast (design system §2)", () => {
  const bg = () => token("bg");
  const elevated = () => token("bg-elevated");

  it.each([
    ["ink", "bg"],
    ["ink", "bg-elevated"],
    ["ink-secondary", "bg"],
    ["ink-secondary", "bg-elevated"],
    ["accent", "bg"],
    ["accent-strong", "bg"],
    ["danger", "bg"],
  ])("--%s on --%s is at least 4.5:1 (normal text)", (fg, on) => {
    expect(contrast(token(fg), token(on))).toBeGreaterThanOrEqual(4.5);
  });

  it("--line-strong meets 3:1 against elevated surfaces (WCAG 1.4.11)", () => {
    expect(contrast(token("line-strong"), elevated())).toBeGreaterThanOrEqual(3);
  });

  it("--ink-on-accent meets 4.5:1 on the brass button fill", () => {
    expect(contrast(token("ink-on-accent"), token("accent"))).toBeGreaterThanOrEqual(4.5);
  });

  it("--bg is not pure black (OLED smear, halation against white text)", () => {
    expect(bg().toLowerCase()).not.toBe("#000000");
  });
});
