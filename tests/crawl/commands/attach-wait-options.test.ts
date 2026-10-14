import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { attachWaitOptions } from "../../../src/crawl/commands/attach-wait-options.js";

describe("attachWaitOptions", () => {
  it("parses wait flags with the given --wait help", () => {
    const command = attachWaitOptions(
      new Command("probe"),
      "Wait for it"
    ).exitOverride();

    command.parse(
      ["--wait", "--progress", "--poll-interval", "2", "--timeout", "30"],
      { from: "user" }
    );

    expect(command.opts()).toEqual({
      wait: true,
      progress: true,
      pollInterval: 2,
      timeout: 30,
    });
    expect(
      command.options.find((option) => option.long === "--wait")?.description
    ).toBe("Wait for it");
  });

  it("rejects a poll interval too large for a timer", () => {
    const command = attachWaitOptions(new Command("probe"), "Wait for it")
      .exitOverride()
      .configureOutput({ writeErr: () => undefined });

    expect(() =>
      command.parse(["--poll-interval", "3000000"], { from: "user" })
    ).toThrow("Must be at most 2147483.");
  });
});
