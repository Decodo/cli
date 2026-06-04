import { BundledSchema, ValidationError } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { resolveTarget } from "../../../src/scrape/services/resolve-target.js";

const schema = BundledSchema.shared;

describe("resolveTarget", () => {
  it("returns default when name is omitted", () => {
    expect(resolveTarget(undefined, schema, "universal")).toBe("universal");
  });

  it("resolves kebab-case to snake_case target", () => {
    expect(resolveTarget("google-search", schema, "universal")).toBe(
      "google_search"
    );
  });

  it("throws for unknown targets", () => {
    expect(() => resolveTarget("not-a-target", schema, "universal")).toThrow(
      ValidationError
    );
  });
});
