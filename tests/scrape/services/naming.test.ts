import { describe, expect, it } from "vitest";
import {
  snakeToCamel,
  snakeToKebab,
} from "../../../src/scrape/services/naming.js";

describe("naming", () => {
  it("converts snake_case to kebab-case", () => {
    expect(snakeToKebab("amazon_product")).toBe("amazon-product");
    expect(snakeToKebab("google_search")).toBe("google-search");
    expect(snakeToKebab("page_from")).toBe("page-from");
  });

  it("converts snake_case to camelCase", () => {
    expect(snakeToCamel("page_from")).toBe("pageFrom");
  });
});
