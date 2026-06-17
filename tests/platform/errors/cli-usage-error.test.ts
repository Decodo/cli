import { describe, expect, it } from "vitest";
import { CliUsageError } from "../../../src/platform/errors/cli-usage-error.js";

describe("CliUsageError", () => {
  it("sets name and message", () => {
    const err = new CliUsageError("bad flag");

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("CliUsageError");
    expect(err.message).toBe("bad flag");
  });
});
