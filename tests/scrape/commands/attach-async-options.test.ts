import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { attachAsyncOptions } from "../../../src/scrape/commands/attach-async-options.js";

function parse(args: string[]): Record<string, unknown> {
  const command = attachAsyncOptions(new Command("target")).exitOverride();
  command.parse(args, { from: "user" });
  return command.opts();
}

describe("attachAsyncOptions", () => {
  it("leaves the async options unset by default", () => {
    expect(parse([])).toEqual({});
  });

  it("parses --async on its own", () => {
    expect(parse(["--async"])).toEqual({ async: true });
  });

  it("parses --async with the wait options", () => {
    expect(
      parse(["--async", "--wait", "--poll-interval", "2", "--timeout", "30"])
    ).toEqual({ async: true, wait: true, pollInterval: 2, timeout: 30 });
  });
});
