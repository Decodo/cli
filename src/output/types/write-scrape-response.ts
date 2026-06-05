import type { OutputOptions } from "./output-options.js";

export interface WriteScrapeResponseContext {
  binary?: {
    kind: "png";
    defaultFileName?: string;
  };
  input?: string;
  options: OutputOptions;
}
