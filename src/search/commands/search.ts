import type { RunSearchRequest } from "@decodo/sdk-ts";
import { Command } from "commander";
import { parsePositiveInt } from "../../cli/services/parse-positive-int.js";
import { createDataAction } from "../../cli/services/run-data-action.js";
import { ScrapeFailedError } from "../../output/errors/scrape-failed-error.js";
import { writeJsonOutput } from "../../output/services/write-json-output.js";
import type { SearchOptions } from "../types/search-command.js";

function buildSearchRequest(
  query: string,
  options: SearchOptions
): RunSearchRequest {
  const request: RunSearchRequest = { query };
  if (options.geo !== undefined) {
    request.geo = options.geo;
  }
  if (options.locale !== undefined) {
    request.locale = options.locale;
  }
  if (options.page !== undefined) {
    request.page = options.page;
  }
  return request;
}

export function createSearchCommand(): Command {
  return new Command("search")
    .description("Search the web and print parsed results as JSON")
    .argument("<query>", "Search query")
    .option("--geo <code>", "Geo / country code")
    .option("--locale <locale>", "Locale, e.g. en-US")
    .option("--page <n>", "Result page number", parsePositiveInt)
    .option("--pretty", "Pretty-print JSON on stdout")
    .option("-o, --output <path>", "Write output to file instead of stdout")
    .action(
      createDataAction<SearchOptions>(async ({ api, input, options }) => {
        const response = await api.search(buildSearchRequest(input, options));
        if (response.status === "failed") {
          throw new ScrapeFailedError(response.message, response.status_code);
        }
        writeJsonOutput(response, options);
      })
    );
}
