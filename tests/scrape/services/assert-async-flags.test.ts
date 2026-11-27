import { describe, expect, it } from "vitest";
import { CliUsageError } from "../../../src/platform/errors/cli-usage-error.js";
import { assertAsyncFlags } from "../../../src/scrape/services/assert-async-flags.js";

describe("assertAsyncFlags", () => {
  it("allows plain scrapes", () => {
    expect(() => assertAsyncFlags({})).not.toThrow();
  });

  it("allows --async on its own", () => {
    expect(() => assertAsyncFlags({ async: true })).not.toThrow();
  });

  it("allows --async with --wait and its options", () => {
    expect(() =>
      assertAsyncFlags({
        async: true,
        wait: true,
        pollInterval: 2,
        timeout: 30,
      })
    ).not.toThrow();
  });

  it("rejects --wait without --async", () => {
    expect(() => assertAsyncFlags({ wait: true })).toThrow(
      new CliUsageError("--wait requires --async.")
    );
  });

  it.each([
    [{ async: true, pollInterval: 2 }, "--poll-interval requires --wait."],
    [{ async: true, timeout: 30 }, "--timeout requires --wait."],
  ])("rejects %j without --wait", (options, message) => {
    expect(() => assertAsyncFlags(options)).toThrow(new CliUsageError(message));
  });
});
