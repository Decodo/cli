import { InvalidArgumentError } from "commander";
import { describe, expect, it } from "vitest";
import { parsePollInterval } from "../../../src/crawl/services/parse-poll-interval.js";

describe("parsePollInterval", () => {
  it("accepts the largest interval a timer can hold", () => {
    expect(parsePollInterval("2147483")).toBe(2_147_483);
  });

  it("rejects an interval a timer cannot hold", () => {
    expect(() => parsePollInterval("2147484")).toThrow(
      new InvalidArgumentError("Must be at most 2147483.")
    );
  });

  it("rejects a non-positive interval", () => {
    expect(() => parsePollInterval("0")).toThrow(InvalidArgumentError);
  });
});
