import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BundledSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { resetCommand } from "../../src/auth/commands/reset.js";
import { setupCommand } from "../../src/auth/commands/setup.js";
import { whoamiCommand } from "../../src/auth/commands/whoami.js";
import { createCodegenTargetCommands } from "../../src/scrape/commands/codegen-target-commands.js";
import { createListTargetsCommand } from "../../src/scrape/commands/list-targets.js";
import { createScrapeCommand } from "../../src/scrape/commands/scrape.js";
import { createScreenshotCommand } from "../../src/scrape/commands/screenshot.js";
import { createSearchCommand } from "../../src/scrape/commands/search.js";

const README_PATH = fileURLToPath(new URL("../../README.md", import.meta.url));

const GLOBAL_FLAGS = new Set([
  "-h",
  "--help",
  "-V",
  "--version",
  "-v",
  "--verbose",
  "--token",
]);

const SHELL_BREAK = new Set(["|", "&&", "||", ";", "&", ">", ">>", "<"]);

function buildProgram(): Command {
  const schema = BundledSchema.shared;
  const program = new Command("decodo")
    .version("0.0.0", "-V, --version")
    .option("-v, --verbose")
    .option("--token <token>");

  for (const command of [
    setupCommand,
    resetCommand,
    whoamiCommand,
    createScrapeCommand(schema),
    createSearchCommand(schema),
    createScreenshotCommand(schema),
    createListTargetsCommand(schema),
    ...createCodegenTargetCommands(schema),
  ]) {
    program.addCommand(command);
  }

  return program;
}

function extractFencedBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const fence = /```[^\n]*\n([\s\S]*?)```/g;
  let match = fence.exec(markdown);
  while (match) {
    blocks.push(match[1]);
    match = fence.exec(markdown);
  }
  return blocks;
}

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  const token = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match = token.exec(line);
  while (match) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
    match = token.exec(line);
  }
  return tokens;
}

function extractInvocations(tokens: string[]): string[][] {
  const invocations: string[][] = [];
  let current: string[] | null = null;

  for (const tok of tokens) {
    if (tok === "decodo") {
      if (current) {
        invocations.push(current);
      }
      current = [];
      continue;
    }

    if (!current) {
      continue;
    }

    if (SHELL_BREAK.has(tok)) {
      invocations.push(current);
      current = null;
      continue;
    }

    current.push(tok);
  }

  if (current) {
    invocations.push(current);
  }

  return invocations;
}

function collectInvocations(markdown: string): string[][] {
  const invocations: string[][] = [];
  for (const block of extractFencedBlocks(markdown)) {
    for (const line of block.split("\n")) {
      invocations.push(...extractInvocations(tokenize(line)));
    }
  }
  return invocations;
}

function knownFlags(command: Command, program: Command): Set<string> {
  const flags = new Set(GLOBAL_FLAGS);
  for (const option of [...program.options, ...command.options]) {
    if (option.long) {
      flags.add(option.long);
    }
    if (option.short) {
      flags.add(option.short);
    }
  }
  return flags;
}

function resolveSubcommand(
  args: string[],
  program: Command
): { command: Command; name: string } | undefined {
  const name = args.find((arg) => !arg.startsWith("-"));
  if (!name) {
    return { command: program, name: "decodo" };
  }

  const command = program.commands.find(
    (cmd) => cmd.name() === name || cmd.aliases().includes(name)
  );
  return command ? { command, name } : undefined;
}

describe("README command examples", () => {
  const markdown = readFileSync(README_PATH, "utf8");
  const program = buildProgram();
  const invocations = collectInvocations(markdown);

  it("documents at least one decodo command", () => {
    expect(invocations.length).toBeGreaterThan(0);
  });

  it("only references commands that exist in the offline command tree", () => {
    const unknown = invocations.filter(
      (args) => !resolveSubcommand(args, program)
    );
    expect(unknown).toEqual([]);
  });

  it("only uses flags that exist on the referenced command", () => {
    const violations: string[] = [];

    for (const args of invocations) {
      const resolved = resolveSubcommand(args, program);
      if (!resolved) {
        continue;
      }

      const flags = knownFlags(resolved.command, program);
      for (const arg of args) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.split("=")[0];
        if (!flags.has(flag)) {
          violations.push(`${resolved.name}: ${flag}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
