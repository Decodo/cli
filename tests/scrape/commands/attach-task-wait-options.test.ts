import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { attachTaskWaitOptions } from "../../../src/scrape/commands/attach-task-wait-options.js";

const POSITIVE_INTEGER_ERROR = /Must be a positive integer/;

function parse(args: string[]): Record<string, unknown> {
  const command = attachTaskWaitOptions(
    new Command("target"),
    "Wait for the task"
  ).exitOverride();
  command.parse(args, { from: "user" });
  return command.opts();
}

describe("attachTaskWaitOptions", () => {
  it("leaves the wait options unset by default", () => {
    expect(parse([])).toEqual({});
  });

  it("parses --wait with its options", () => {
    expect(
      parse(["--wait", "--poll-interval", "2", "--timeout", "30"])
    ).toEqual({ wait: true, pollInterval: 2, timeout: 30 });
  });

  it.each([
    ["--poll-interval", "0"],
    ["--timeout", "abc"],
  ])("rejects %s %s", (flag, value) => {
    expect(() => parse(["--wait", flag, value])).toThrow(
      POSITIVE_INTEGER_ERROR
    );
  });
});
