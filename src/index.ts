#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { createCommands } from "./cli/register.js";
import { configureCommanderExit } from "./cli/services/configure-commander-exit.js";
import { handleCliError } from "./platform/services/handle-cli-error.js";

function readVersion(): string {
  const pkgPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "package.json"
  );
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };

  return pkg.version;
}

const program = new Command()
  .name("decodo")
  .description("Official CLI for Decodo APIs")
  .version(readVersion(), "-V, --version", "output the version number")
  .option("-v, --verbose", "Print debug logs to stderr")
  .option(
    "--token <token>",
    "Basic auth token (overrides DECODO_AUTH_TOKEN and saved config)"
  );

async function main(): Promise<void> {
  for (const command of await createCommands()) {
    program.addCommand(command);
  }

  configureCommanderExit(program);

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  handleCliError(err);
});
