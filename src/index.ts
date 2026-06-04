#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { createCommands } from "./cli/register.js";

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

const program = new Command()
  .name("decodo")
  .description("Official CLI for Decodo APIs")
  .version(readVersion(), "-V, --version", "output the version number")
  .option(
    "--token <token>",
    "Basic auth token (overrides DECODO_AUTH_TOKEN and saved config)"
  );

async function main(): Promise<void> {
  for (const command of await createCommands()) {
    program.addCommand(command);
  }

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
