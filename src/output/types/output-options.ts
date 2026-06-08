export type OutputFormat = "ndjson";

export interface OutputOptions {
  format?: OutputFormat;
  full?: boolean;
  output?: string;
  pretty?: boolean;
}
