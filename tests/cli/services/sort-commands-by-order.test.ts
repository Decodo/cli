import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { sortCommandsByOrder } from "../../../src/cli/services/sort-commands-by-order.js";

describe("sortCommandsByOrder", () => {
  it("sorts known commands by explicit order", () => {
    const commands = [
      new Command("whoami"),
      new Command("scrape"),
      new Command("universal"),
      new Command("search"),
      new Command("setup"),
    ];

    expect(sortCommandsByOrder(commands).map((c) => c.name())).toEqual([
      "scrape",
      "search",
      "setup",
      "whoami",
      "universal",
    ]);
  });

  it("sorts unlisted commands after known ones, alphabetically", () => {
    const commands = [
      new Command("zebra-target"),
      new Command("scrape"),
      new Command("alpha-target"),
    ];

    expect(sortCommandsByOrder(commands).map((c) => c.name())).toEqual([
      "scrape",
      "alpha-target",
      "zebra-target",
    ]);
  });
});
