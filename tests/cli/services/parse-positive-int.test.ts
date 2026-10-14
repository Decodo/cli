import { InvalidArgumentError } from "commander";
import { describe, expect, it } from "vitest";
import { parsePositiveInt } from "../../../src/cli/services/parse-positive-int.js";

describe("parsePositiveInt", () => {
  it("parses positive integers", () => {
    expect(parsePositiveInt("12")).toBe(12);
  });

  it.each(["0", "-1", "1.5", "abc", ""])("rejects %j", (value) => {
    expect(() => parsePositiveInt(value)).toThrow(InvalidArgumentError);
  });
});
