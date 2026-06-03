import type { JSONSchema4 } from "json-schema";
import { describe, expect, it } from "vitest";
import { getPrimaryInputField } from "../../../src/scrape/services/primary-input.js";

describe("getPrimaryInputField", () => {
  it("prefers query over url", () => {
    const schema: JSONSchema4 = {
      type: "object",
      properties: {
        query: { type: "string" },
        url: { type: "string" },
      },
    };

    expect(getPrimaryInputField(schema)).toBe("query");
  });

  it("returns url when query is absent", () => {
    const schema: JSONSchema4 = {
      type: "object",
      properties: {
        url: { type: "string" },
      },
    };

    expect(getPrimaryInputField(schema)).toBe("url");
  });

  it("returns undefined when no primary input fields exist", () => {
    const schema: JSONSchema4 = {
      type: "object",
      properties: {
        callback_url: { type: "string" },
      },
    };

    expect(getPrimaryInputField(schema)).toBeUndefined();
  });
});
