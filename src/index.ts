#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { DEFAULT_MAX_RETRIES } from "./auth/services/global-opts.js";
import { createCommands } from "./cli/register.js";
import { handleCliError } from "./platform/services/handle-cli-error.js";

function readVersion(): string {
  const entry = process.argv[1];
  if (!entry) {
    throw new Error("Unable to resolve CLI entry path");
  }

  const packageJsonPath = join(dirname(entry), "..", "..", "package.json");
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version: string;
  };

  return pkg.version;
}

function parseIntegerOption(
  value: string,
  optionName: string,
  min: number
): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < min) {
    throw new InvalidArgumentError(
      `${optionName} must be an integer greater than or equal to ${min}.`
    );
  }
  return parsed;
}

function parseTimeoutMs(value: string): number {
  return parseIntegerOption(value, "--timeout", 1);
}

function parseMaxRetries(value: string): number {
  return parseIntegerOption(value, "--max-retries", 0);
}

const program = new Command()
  .name("decodo")
  .description("Official CLI for Decodo APIs")
  .version(readVersion(), "-V, --version", "output the version number")
  .option(
    "--token <token>",
    "Basic auth token (overrides DECODO_AUTH_TOKEN and saved config)"
  )
  .option(
    "--timeout <ms>",
    "Request timeout in milliseconds (SDK default: 180000ms)",
    parseTimeoutMs
  )
  .option(
    "--max-retries <N>",
    "Retry attempts for rate limits and server errors",
    parseMaxRetries,
    DEFAULT_MAX_RETRIES
  );

async function main(): Promise<void> {
  for (const command of await createCommands()) {
    program.addCommand(command);
  }

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  handleCliError(err);
});
