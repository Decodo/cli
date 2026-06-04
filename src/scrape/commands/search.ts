import { type DecodoSchema, Target, ValidationError } from "@decodo/sdk-ts";
import { Command, Option } from "commander";
import { resolveTarget } from "../services/resolve-target.js";
import { createTargetAction } from "../services/run-target-scrape.js";
import type { SearchOptions } from "../types/search-command.js";

const ENGINE_TARGETS = {
  google: Target.GoogleSearch,
  bing: Target.BingSearch,
} as const;

const PAGE_COUNT_MIN = 1;
const PAGE_COUNT_MAX = 10;

function parseLimit(value: string): number {
  const limit = Number.parseInt(value, 10);
  if (Number.isNaN(limit)) {
    throw new ValidationError("Invalid --limit: must be an integer.");
  }
  return limit;
}

function validatePageCount(limit: number): void {
  if (limit < PAGE_COUNT_MIN || limit > PAGE_COUNT_MAX) {
    throw new ValidationError(
      `--limit must be between ${PAGE_COUNT_MIN} and ${PAGE_COUNT_MAX}.`
    );
  }
}

function resolveSearchTarget(
  opts: SearchOptions,
  schema: DecodoSchema
): string {
  if (opts.target !== undefined) {
    return resolveTarget(opts.target, schema, Target.GoogleSearch);
  }

  const engine = opts.engine ?? "google";
  const target = ENGINE_TARGETS[engine as keyof typeof ENGINE_TARGETS];
  if (target === undefined) {
    throw new ValidationError(`Unknown search engine: ${engine}`);
  }

  return target;
}

export function createSearchCommand(schema: DecodoSchema): Command {
  return new Command("search")
    .description(
      "Search the web (default: Google). Use decodo google-search or decodo bing-search for full options."
    )
    .argument("<query>", "Search query")
    .addOption(
      new Option("--engine <engine>", "Search engine")
        .choices(["google", "bing"])
        .default("google")
    )
    .option("--geo <code>", "Geo / country code")
    .option("--limit <n>", "Number of result pages", parseLimit)
    .option("--target <name>", "Scrape target override")
    .action(
      createTargetAction(Target.GoogleSearch, schema, (query, options) => {
        if (query === undefined) {
          throw new Error("Missing required query.");
        }

        const opts = options as SearchOptions;
        const body: Record<string, unknown> = {
          target: resolveSearchTarget(opts, schema),
          query,
        };

        if (opts.geo !== undefined) {
          body.geo = opts.geo;
        }

        if (opts.limit !== undefined) {
          validatePageCount(opts.limit);
          body.page_count = opts.limit;
        }

        return body;
      })
    );
}
