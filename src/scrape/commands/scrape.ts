import { type DecodoSchema, Target, ValidationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { resolveTarget } from "../services/resolve-target.js";
import { createTargetAction } from "../services/run-target-scrape.js";
import type { ScrapeOptions } from "../types/scrape-command.js";

function parseHeadersJson(json: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(json);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    throw new ValidationError("Headers must be a JSON object.");
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : "invalid JSON";
    throw new ValidationError(`Invalid --headers JSON: ${detail}`);
  }
}

export function createScrapeCommand(schema: DecodoSchema): Command {
  return new Command("scrape")
    .description(
      "Scrape a URL (universal target, markdown). Use decodo universal or decodo <target> for full options."
    )
    .argument("<url>", "URL to scrape")
    .option("--country <code>", "Geo / country code (maps to geo)")
    .option("--headers <json>", "Request headers as a JSON object string")
    .option("--target <name>", "Scrape target override (default: universal)")
    .action(
      createTargetAction(Target.Universal, schema, (url, options) => {
        if (url === undefined) {
          throw new Error("Missing required URL.");
        }

        const opts = options as ScrapeOptions;
        const body: Record<string, unknown> = {
          target: resolveTarget(opts.target, schema, Target.Universal),
          url,
          markdown: true,
        };

        if (opts.country !== undefined) {
          body.geo = opts.country;
        }

        if (opts.headers !== undefined) {
          body.headers = parseHeadersJson(opts.headers);
        }

        return body;
      })
    );
}
