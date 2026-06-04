import type { Command } from "commander";
import { Option } from "commander";
import { OUTPUT_FORMATS } from "./types.js";

export interface AttachScrapeOutputOptionsConfig {
  outputHelp?: string;
}

export function attachScrapeOutputOptions(
  command: Command,
  config: AttachScrapeOutputOptionsConfig = {}
): Command {
  return command
    .addOption(
      new Option("--format <format>", "Output format").choices([
        ...OUTPUT_FORMATS,
      ])
    )
    .option("--json", "Output JSON (shortcut for --format json)")
    .option("--html", "Output HTML (shortcut for --format html)")
    .option("--full", "Emit full API response envelope")
    .option("--pretty", "Pretty-print JSON output")
    .option(
      "-o, --output <path>",
      config.outputHelp ?? "Write output to file instead of stdout"
    );
}
