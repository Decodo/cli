import type { DecodoSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { snakeToKebab } from "../services/naming.js";

export function createListTargetsCommand(schema: DecodoSchema): Command {
  return new Command("targets")
    .description("List available scrape targets")
    .action(() => {
      const grouped = new Map<string, string[]>();

      for (const target of schema.listTargets()) {
        const group = schema.getTargetMeta(target)?.group ?? "Other";
        const names = grouped.get(group) ?? [];
        names.push(snakeToKebab(target));
        grouped.set(group, names);
      }

      const groups = [...grouped.keys()].sort((a, b) => a.localeCompare(b));

      for (const group of groups) {
        const targets = grouped.get(group) ?? [];
        targets.sort((a, b) => a.localeCompare(b));
        console.log(`${group}:`);
        for (const name of targets) {
          console.log(`  ${name}`);
        }
      }
    });
}
