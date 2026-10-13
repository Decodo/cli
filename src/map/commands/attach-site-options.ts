import { type Command, Option } from "commander";
import { collectValues } from "../../cli/services/collect-values.js";
import { parsePositiveInt } from "../../cli/services/parse-positive-int.js";
import { DOMAIN_FILTERS, SITEMAP_MODES } from "../constants.js";

export function attachSiteOptions(command: Command): Command {
  return command
    .option("--limit <n>", "Maximum number of pages", parsePositiveInt)
    .addOption(
      new Option("--sitemap <mode>", "Sitemap usage").choices(SITEMAP_MODES)
    )
    .addOption(
      new Option("--domain-filter <scope>", "Which hosts to follow").choices(
        DOMAIN_FILTERS
      )
    )
    .option("--geo <code>", "Geo / country code")
    .option("--locale <locale>", "Locale, e.g. en-US")
    .option(
      "--select-paths <pattern>",
      "Only include matching paths (repeatable)",
      collectValues
    )
    .option(
      "--exclude-paths <pattern>",
      "Skip matching paths (repeatable)",
      collectValues
    );
}
