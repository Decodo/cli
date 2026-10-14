import { Command } from "commander";

export function runDataCommand(command: Command, args: string[]) {
  const program = new Command()
    .option("--token <token>")
    .exitOverride()
    .addCommand(command.exitOverride());

  return program.parseAsync(args, { from: "user" });
}
