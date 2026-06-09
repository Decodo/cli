import type { Command, CommanderError } from "commander";
import { EXIT } from "../../platform/constants.js";

function applyCommanderExit(
  command: Command,
  handler: (err: CommanderError) => never
): void {
  command.exitOverride(handler);
  for (const subcommand of command.commands) {
    applyCommanderExit(subcommand, handler);
  }
}

export function configureCommanderExit(program: Command): void {
  applyCommanderExit(program, (err: CommanderError) => {
    process.exit(err.exitCode === 0 ? EXIT.OK : EXIT.USAGE);
  });
}
