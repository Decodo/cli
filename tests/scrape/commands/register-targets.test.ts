import { BundledSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { registerTargetCommands } from "../../../src/scrape/commands/register-targets.js";

describe("registerTargetCommands", () => {
  it("registers one subcommand per target", () => {
    const program = new Command();
    const schema = BundledSchema.shared;

    registerTargetCommands(program, schema);

    expect(program.commands).toHaveLength(schema.listTargets().length);
    expect(
      program.commands.some((cmd) => cmd.name() === "amazon-product")
    ).toBe(true);
    expect(program.commands.some((cmd) => cmd.name() === "google-search")).toBe(
      true
    );
  });
});
