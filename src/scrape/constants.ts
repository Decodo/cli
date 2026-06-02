// TODO(SCR-3150): switch to cli when sdk task lands
export const INTEGRATION_HEADER = "cli";

export const SCHEMA_TTL_MS = 3_600_000;

/** Bundled IR version shipped with @decodo/sdk-ts (offline fallback). */
export const BUNDLED_SPEC_VERSION = "2.0.1";

export const PRIMARY_INPUT_FIELDS = [
  "query",
  "url",
  "product_id",
  "prompt",
] as const;

export type PrimaryInputField = (typeof PRIMARY_INPUT_FIELDS)[number];
