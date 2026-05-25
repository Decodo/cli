#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { logoutCommand } from "./auth/commands/logout.js";
import { setupCommand } from "./auth/commands/setup.js";
import { whoamiCommand } from "./auth/commands/whoami.js";

const commandsRegistry = [setupCommand, logoutCommand, whoamiCommand];

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

for (const command of commandsRegistry) {
  program.addCommand(command);
}

async function main(): Promise<void> {
  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
