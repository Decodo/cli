import { BundledSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { createTargetCommands } from "../../../src/scrape/commands/target-commands.js";

describe("createTargetCommands", () => {
  it("builds one subcommand per target", () => {
    const program = new Command();
    const schema = BundledSchema.shared;

    for (const command of createTargetCommands(schema)) {
      program.addCommand(command);
    }

    expect(program.commands).toHaveLength(schema.listTargets().length);
    expect(
      program.commands.some((cmd) => cmd.name() === "amazon-product")
    ).toBe(true);
    expect(program.commands.some((cmd) => cmd.name() === "google-search")).toBe(
      true
    );
  });
});
