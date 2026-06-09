import { type DecodoSchema, Target, ValidationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { attachBatchOptions } from "../../batch/commands/attach-batch-options.js";
import { attachScrapeOutputOptions } from "../../output/commands/attach-output-options.js";
import { applyRequestDefaults } from "../../output/services/apply-request-defaults.js";
import type { OutputOptions } from "../../output/types/output-options.js";
import { CliUsageError } from "../../platform/services/handle-cli-error.js";
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
  const command = new Command("scrape")
    .description(
      "Scrape a URL with the universal target (markdown by default). Use decodo universal for --markdown, --parse, and other API flags."
    )
    .argument("[url]", "URL to scrape (omit when using --input-file)")
    .option("--country <code>", "Geo / country code (maps to geo)")
    .option("--headers <json>", "Request headers as a JSON object string")
    .option("--target <name>", "Scrape target override (default: universal)");

  attachScrapeOutputOptions(command);
  attachBatchOptions(command);

  return command.action(
    createTargetAction(Target.Universal, schema, (url, options) => {
      if (url === undefined) {
        throw new CliUsageError("Missing required URL.");
      }

      const opts = options as ScrapeOptions & OutputOptions;
      const resolvedTarget = resolveTarget(
        opts.target,
        schema,
        Target.Universal
      );
      const body: Record<string, unknown> = {
        target: resolvedTarget,
        url,
      };

      applyRequestDefaults(body, resolvedTarget, schema);

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
