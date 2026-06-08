import { BundledSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { createCodegenTargetCommands } from "../../../src/scrape/commands/codegen-target-commands.js";

describe("createCodegenTargetCommands", () => {
  it("builds one subcommand per target", () => {
    const program = new Command();
    const schema = BundledSchema.shared;

    for (const command of createCodegenTargetCommands(schema)) {
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

  it("does not expose None as a command description group", () => {
    const schema = BundledSchema.shared;

    for (const command of createCodegenTargetCommands(schema)) {
      expect(command.description()).not.toContain("None scrape target");
    }
  });
});
