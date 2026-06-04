import type { DecodoSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { configureTargetCommand } from "../services/command-builder.js";
import { snakeToKebab } from "../services/naming.js";
import { createTargetAction } from "../services/run-target-scrape.js";

export function createCodegenTargetCommands(schema: DecodoSchema): Command[] {
  const commands: Command[] = [];

  for (const target of schema.listTargets()) {
    const commandName = snakeToKebab(target);
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
