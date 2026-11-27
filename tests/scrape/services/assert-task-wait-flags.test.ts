import { describe, expect, it } from "vitest";
import { CliUsageError } from "../../../src/platform/errors/cli-usage-error.js";
import { assertTaskWaitFlags } from "../../../src/scrape/services/assert-task-wait-flags.js";

describe("assertTaskWaitFlags", () => {
  it("allows the wait options with --wait", () => {
    expect(() =>
      assertTaskWaitFlags({ wait: true, pollInterval: 2, timeout: 30 })
    ).not.toThrow();
  });

  it("allows no wait options at all", () => {
    expect(() => assertTaskWaitFlags({})).not.toThrow();
  });

  it.each([
    [{ pollInterval: 2 }, "--poll-interval requires --wait."],
    [{ timeout: 30 }, "--timeout requires --wait."],
  ])("rejects %j without --wait", (options, message) => {
    expect(() => assertTaskWaitFlags(options)).toThrow(
      new CliUsageError(message)
    );
  });
});
