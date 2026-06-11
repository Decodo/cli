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

  it("uses a generic description for targets without a real group", () => {
    const schema = BundledSchema.shared;
    const commands = createCodegenTargetCommands(schema);

    const ungrouped = commands.find((cmd) => cmd.name() === "youtube-video");
    expect(ungrouped?.description()).toBe("Scrape target");

    const grouped = commands.find((cmd) => cmd.name() === "amazon-product");
    expect(grouped?.description()).toBe("Amazon scrape target");
  });
});
