import { describe, expect, it } from "vitest";
import { parseTimeout } from "../../../src/cli/services/parse-timeout.js";
import { CliUsageError } from "../../../src/platform/services/handle-cli-error.js";

describe("parseTimeout", () => {
  it("parses a positive integer of milliseconds", () => {
    expect(parseTimeout("5000")).toBe(5000);
  });

  it.each(["0", "-1", "abc", ""])("rejects %p as a usage error", (value) => {
    expect(() => parseTimeout(value)).toThrow(CliUsageError);
  });
});
