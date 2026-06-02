import type { DecodoSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { configureTargetCommand } from "../services/command-builder.js";
import { toKebabCommand } from "../services/target-name.js";
import { createTargetAction } from "./run-target-scrape.js";

export function createTargetCommands(schema: DecodoSchema): Command[] {
  const commands: Command[] = [];

  for (const target of schema.listTargets()) {
    const commandName = toKebabCommand(target);
    const meta = schema.getTargetMeta(target);
    const command = new Command(commandName).description(
      meta?.group ? `${meta.group} scrape target` : `${target} scrape target`
    );

    configureTargetCommand(command, target, schema);
    command.action(createTargetAction(target, schema));
    commands.push(command);
  }

  return commands;
}

export function registerTargetCommands(
  program: Command,
  schema: DecodoSchema
): void {
  for (const command of createTargetCommands(schema)) {
    program.addCommand(command);
  }
}
