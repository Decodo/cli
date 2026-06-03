import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { collectCommandNames } from "../../../src/cli/services/collect-command-names.js";

describe("collectCommandNames", () => {
  it("collects top-level command names", () => {
    const commands = [
      new Command("setup"),
      new Command("scrape"),
      new Command("universal"),
    ];

    expect(collectCommandNames(commands)).toEqual(
      new Set(["setup", "scrape", "universal"])
    );
  });
});
