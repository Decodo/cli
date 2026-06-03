import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { prepareArgv } from "../../../src/cli/services/prepare-argv.js";

describe("prepareArgv", () => {
  it("rewrites decodo <url> to decodo scrape <url>", () => {
    const commands = [new Command("scrape"), new Command("setup")];
    const argv = ["node", "decodo", "https://example.com"];

    expect(prepareArgv(argv, commands)).toEqual([
      "node",
      "decodo",
      "scrape",
      "https://example.com",
    ]);
  });
});
