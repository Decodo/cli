import { Command, Option } from "commander";
import { parsePositiveInt } from "../../cli/services/parse-positive-int.js";
import { createDataAction } from "../../cli/services/run-data-action.js";
import { verboseLog } from "../../cli/services/verbose-log.js";
import { attachSiteOptions } from "../../map/commands/attach-site-options.js";
import { writeJsonOutput } from "../../output/services/write-json-output.js";
import {
  CRAWL_CONTENT_FORMATS,
  CRAWL_START_WAIT_ONLY_FLAGS,
} from "../constants.js";
import { assertWaitFlags } from "../services/assert-wait-flags.js";
import { buildCrawlRequest } from "../services/build-crawl-request.js";
import { settleCrawl } from "../services/settle-crawl.js";
import { writeCrawlPages } from "../services/write-crawl-pages.js";
import type {
  CrawlOptions,
  CrawlResultsOptions,
  CrawlStatusOptions,
} from "../types/crawl-command.js";
import { attachWaitOptions } from "./attach-wait-options.js";

function createCrawlStatusCommand(): Command {
  return new Command("status")
    .description("Show the progress of a crawl as JSON")
    .argument("<id>", "Crawl id")
    .option("--pretty", "Pretty-print JSON on stdout")
    .action(
      createDataAction<CrawlStatusOptions>(async ({ api, input, options }) => {
        writeJsonOutput(await api.getCrawlStatus(input), options);
      })
    );
}

function createCrawlResultsCommand(): Command {
  const command = new Command("results")
    .description("Print the pages of a crawl as NDJSON")
    .argument("<id>", "Crawl id")
    .option("--no-content", "Skip page content, list page metadata only")
    .option("-o, --output <path>", "Write NDJSON to file instead of stdout");

  return attachWaitOptions(
    command,
    "Wait for the crawl to finish before printing its pages"
  ).action(
    createDataAction<CrawlResultsOptions>(async ({ api, input, options }) => {
      assertWaitFlags(options);
      if (options.wait) {
        await settleCrawl(api, input, options);
      }

      const pages = await api.getCrawlResults(input, {
        content: options.content,
      });
      writeCrawlPages(pages, options.output);
    })
  );
}

function createCrawlCancelCommand(): Command {
  return new Command("cancel")
    .description("Stop a running crawl")
    .argument("<id>", "Crawl id")
    .option("--pretty", "Pretty-print JSON on stdout")
    .action(
      createDataAction<CrawlStatusOptions>(async ({ api, input, options }) => {
        writeJsonOutput(await api.cancelCrawl(input), options);
      })
    );
}

export function createCrawlCommand(): Command {
  const command = new Command("crawl")
    .description(
      "Start a crawl and print its id; --wait prints the pages as NDJSON"
    )
    .enablePositionalOptions()
    .argument("<url>", "Site URL to crawl")
    .option("--max-depth <n>", "Maximum link depth", parsePositiveInt)
    .option(
      "--max-duration <seconds>",
      "Stop the crawl after this many seconds",
      parsePositiveInt
    )
    .addOption(
      new Option("--content-format <format>", "Page content format").choices(
        CRAWL_CONTENT_FORMATS
      )
    );

  attachSiteOptions(command);

  return attachWaitOptions(
    command,
    "Wait for the crawl to finish and print its pages"
  )
    .option(
      "-o, --output <path>",
      "Write NDJSON to file instead of stdout (with --wait)"
    )
    .action(
      createDataAction<CrawlOptions>(
        async ({ api, input, options, verbose }) => {
          assertWaitFlags(options, CRAWL_START_WAIT_ONLY_FLAGS);

          const { crawl_id: crawlId } = await api.startCrawl(
            buildCrawlRequest(input, options)
          );
          if (!options.wait) {
            process.stdout.write(`${crawlId}\n`);
            return;
          }

          verboseLog(verbose, `crawl started id=${crawlId}`);
          await settleCrawl(api, crawlId, options);
          writeCrawlPages(await api.getCrawlResults(crawlId), options.output);
        }
      )
    )
    .addCommand(createCrawlStatusCommand())
    .addCommand(createCrawlResultsCommand())
    .addCommand(createCrawlCancelCommand());
}
