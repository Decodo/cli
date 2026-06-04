import type { DecodoSchema } from "@decodo/sdk-ts";
import type { OutputOptions } from "./output-options.js";

export interface WriteScrapeResponseContext {
  options: OutputOptions;
  schema: DecodoSchema;
  target: string;
}
