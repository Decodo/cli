import type { Command } from "commander";
import { Option } from "commander";

export interface AttachScrapeOutputOptionsConfig {
  outputHelp?: string;
}

export function attachScrapeOutputOptions(
  command: Command,
  config: AttachScrapeOutputOptionsConfig = {}
): Command {
  return command
    .addOption(
      new Option("--format <format>", "Output format").choices(["ndjson"])
    )
    .option("--full", "Emit full API response envelope")
    .option("--pretty", "Pretty-print JSON objects on stdout")
    .option(
      "-o, --output <path>",
      config.outputHelp ?? "Write output to file instead of stdout"
    );
}
