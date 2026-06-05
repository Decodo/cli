import { type DecodoSchema, Target } from "@decodo/sdk-ts";
import { Command } from "commander";
import { attachScrapeOutputOptions } from "../../output/commands/attach-output-options.js";
import { resolveTarget } from "../services/resolve-target.js";
import { createTargetAction } from "../services/run-target-scrape.js";
import type { ScreenshotOptions } from "../types/screenshot-command.js";

export function createScreenshotCommand(schema: DecodoSchema): Command {
  const command = new Command("screenshot")
    .description(
      "Capture a PNG screenshot (universal, headless). Use decodo universal --headless png for full options."
    )
    .argument("<url>", "URL to screenshot")
    .option("--country <code>", "Geo / country code (maps to geo)")
    .option("--target <name>", "Scrape target override (default: universal)");

  attachScrapeOutputOptions(command, {
    outputHelp: "Write PNG to file or directory (default name: <host>.png)",
  });

  return command.action(
    createTargetAction(
      Target.Universal,
      schema,
      (url, options) => {
        if (url === undefined) {
          throw new Error("Missing required URL.");
        }

        const opts = options as ScreenshotOptions;
        const body: Record<string, unknown> = {
          target: resolveTarget(opts.target, schema, Target.Universal),
          url,
          headless: "png",
        };

        if (opts.country !== undefined) {
          body.geo = opts.country;
        }

        return body;
      },
      (url) => ({
        binary: { kind: "png" },
        input: url,
      })
    )
  );
}
