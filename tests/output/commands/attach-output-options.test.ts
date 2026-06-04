import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { attachScrapeOutputOptions } from "../../../src/output/commands/attach-output-options.js";

describe("attachScrapeOutputOptions", () => {
  it("registers scrape output flags", () => {
    const command = attachScrapeOutputOptions(new Command("scrape"));
    const flags = command.options.map((o) => o.flags);

    expect(flags).toEqual(
      expect.arrayContaining([
        "--format <format>",
        "--json",
        "--html",
        "--full",
        "--pretty",
        "-o, --output <path>",
      ])
    );
  });

  it("uses custom -o help when provided", () => {
    const command = attachScrapeOutputOptions(new Command("screenshot"), {
      outputHelp: "Write PNG to file",
    });
    const output = command.options.find((o) => o.long === "--output");

    expect(output?.description).toBe("Write PNG to file");
  });
});
