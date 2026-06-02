import { describe, expect, it } from "vitest";
import {
  toKebabCommand,
  toSnakeTarget,
} from "../../../src/scrape/services/target-name.js";

describe("target-name", () => {
  it("converts snake_case targets to kebab-case commands", () => {
    expect(toKebabCommand("amazon_product")).toBe("amazon-product");
    expect(toKebabCommand("google_search")).toBe("google-search");
  });

  it("converts kebab-case commands back to snake_case targets", () => {
    expect(toSnakeTarget("amazon-product")).toBe("amazon_product");
    expect(toSnakeTarget("google-search")).toBe("google_search");
  });
});
