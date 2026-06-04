import { BundledSchema, Target } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { applyRequestDefaults } from "../../../src/output/services/apply-request-defaults.js";

const schema = BundledSchema.shared;

describe("applyRequestDefaults", () => {
  it("defaults parse and markdown:false for google_search", () => {
    const body: Record<string, unknown> = {
      target: Target.GoogleSearch,
      query: "coffee",
    };

    applyRequestDefaults(body, Target.GoogleSearch, schema);

    expect(body).toEqual({
      target: Target.GoogleSearch,
      query: "coffee",
      parse: true,
      markdown: false,
    });
  });

  it("defaults markdown:true for universal", () => {
    const body: Record<string, unknown> = {
      target: Target.Universal,
      url: "https://example.com",
    };

    applyRequestDefaults(body, Target.Universal, schema);

    expect(body).toEqual({
      target: Target.Universal,
      url: "https://example.com",
      markdown: true,
    });
  });

  it("does not override explicit parse or markdown", () => {
    const body: Record<string, unknown> = {
      target: Target.GoogleSearch,
      query: "coffee",
      parse: false,
      markdown: true,
    };

    applyRequestDefaults(body, Target.GoogleSearch, schema);

    expect(body.parse).toBe(false);
    expect(body.markdown).toBe(true);
  });
});
