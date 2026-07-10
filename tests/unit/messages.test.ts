import { describe, expect, it } from "vitest";
import ro from "../../messages/ro.json";
import en from "../../messages/en.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("message files", () => {
  // CLAUDE.md rule 2: both locales are updated together, key sets identical.
  // A key present in only one file breaks the other locale at runtime on
  // whatever (possibly conditionally-rendered) path uses it.
  it("ro.json and en.json carry identical key sets", () => {
    const roKeys = keyPaths(ro).sort();
    const enKeys = keyPaths(en).sort();
    expect(roKeys).toEqual(enKeys);
  });
});
