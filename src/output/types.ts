export const OUTPUT_FORMATS = ["markdown", "json", "html", "raw"] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export interface OutputOptions {
  format?: string;
  full?: boolean;
  html?: boolean;
  json?: boolean;
  output?: string;
  pretty?: boolean;
}
