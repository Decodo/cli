import { describe, expect, it } from "vitest";
import { collectValues } from "../../../src/cli/services/collect-values.js";

describe("collectValues", () => {
  it("starts a list on first use", () => {
    expect(collectValues("/blog/*")).toEqual(["/blog/*"]);
  });

  it("appends repeated values", () => {
    expect(collectValues("/docs/*", ["/blog/*"])).toEqual([
      "/blog/*",
      "/docs/*",
    ]);
  });
});
