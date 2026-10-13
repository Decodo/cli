import { Command } from "commander";
import { createDataAction } from "../../cli/services/run-data-action.js";
import { writeJsonOutput } from "../../output/services/write-json-output.js";
import { writeTextOutput } from "../../output/services/write-text-output.js";
import { buildSiteRequest } from "../services/build-site-request.js";
import type { MapOptions } from "../types/map-command.js";
import { attachSiteOptions } from "./attach-site-options.js";

export function createMapCommand(): Command {
  const command = new Command("map")
    .description("List the URLs on a site, one per line")
    .argument("<url>", "Site URL to map")
    .option("--js-rendering", "Render JavaScript while discovering links");

  return attachSiteOptions(command)
    .option("--full", "Print the full API response as JSON")
    .option("--pretty", "Pretty-print JSON on stdout (with --full)")
    .option("-o, --output <path>", "Write output to file instead of stdout")
    .action(
      createDataAction<MapOptions>(async ({ api, input, options }) => {
        const request = buildSiteRequest(input, options);
        if (options.jsRendering) {
          request.JS_rendering = true;
        }

        const response = await api.map(request);
        if (options.full) {
          writeJsonOutput(response, options);
          return;
        }

        const urls = response.results.flatMap((result) =>
          result.content.links.map((link) => link.url)
        );
        writeTextOutput(urls.join("\n"), options);
      })
    );
}
