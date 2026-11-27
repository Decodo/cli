import { BundledSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCodegenTargetCommands } from "../../../src/scrape/commands/codegen-target-commands.js";

describe("createCodegenTargetCommands", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    const getTargetMeta = schema.getTargetMeta.bind(schema);
    vi.spyOn(schema, "getTargetMeta").mockImplementation((target) => {
      const meta = getTargetMeta(target);
      return target === "google_search" && meta
        ? { ...meta, group: "None" }
        : meta;
    });
    const commands = createCodegenTargetCommands(schema);

    const ungrouped = commands.find((cmd) => cmd.name() === "google-search");
    expect(ungrouped?.description()).toBe("Scrape target");

    const grouped = commands.find((cmd) => cmd.name() === "amazon-product");
    expect(grouped?.description()).toBe("Amazon scrape target");
  });
});
