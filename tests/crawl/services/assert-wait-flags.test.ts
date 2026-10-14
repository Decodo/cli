import { describe, expect, it } from "vitest";
import { CRAWL_START_WAIT_ONLY_FLAGS } from "../../../src/crawl/constants.js";
import { assertWaitFlags } from "../../../src/crawl/services/assert-wait-flags.js";
import { CliUsageError } from "../../../src/platform/errors/cli-usage-error.js";

describe("assertWaitFlags", () => {
  it("allows wait-only flags with --wait", () => {
    expect(() =>
      assertWaitFlags(
        {
          wait: true,
          progress: true,
          pollInterval: 2,
          timeout: 30,
          output: "pages.ndjson",
        },
        CRAWL_START_WAIT_ONLY_FLAGS
      )
    ).not.toThrow();
  });

  it("allows plain crawls", () => {
    expect(() => assertWaitFlags({})).not.toThrow();
  });

  it("allows --output without --wait by default", () => {
    expect(() => assertWaitFlags({ output: "pages.ndjson" })).not.toThrow();
  });

  it.each([
    [{ progress: true }, "--progress requires --wait."],
    [{ pollInterval: 2 }, "--poll-interval requires --wait."],
    [{ timeout: 30 }, "--timeout requires --wait."],
    [{ output: "pages.ndjson" }, "--output requires --wait."],
  ])("rejects %j without --wait", (options, message) => {
    expect(() => assertWaitFlags(options, CRAWL_START_WAIT_ONLY_FLAGS)).toThrow(
      new CliUsageError(message)
    );
  });
});
