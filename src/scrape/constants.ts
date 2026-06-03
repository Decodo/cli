// TODO(SCR-3150): switch to cli when sdk task lands
export const INTEGRATION_HEADER = "cli";

export const SCHEMA_TTL_MS = 3_600_000;

export const PRIMARY_INPUT_FIELDS = [
  "query",
  "url",
  "product_id",
  "prompt",
] as const;

export type PrimaryInputField = (typeof PRIMARY_INPUT_FIELDS)[number];
