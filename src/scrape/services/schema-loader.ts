import { BundledSchema, type DecodoSchema, RemoteSchema } from "@decodo/sdk-ts";
import { BUNDLED_SPEC_VERSION, SCHEMA_TTL_MS } from "../constants.js";

export type SchemaSource = "remote" | "bundled";

export interface LoadedSchema {
  schema: DecodoSchema;
  source: SchemaSource;
}

const SEMVER_NUMERIC_PREFIX = /^\d+/;

function parseSemverPart(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const numeric = value.match(SEMVER_NUMERIC_PREFIX);
  return numeric ? Number.parseInt(numeric[0], 10) : 0;
}

function compareSemver(a: string, b: string): number {
  const partsA = a.split(".");
  const partsB = b.split(".");

  for (let index = 0; index < 3; index++) {
    const diff =
      parseSemverPart(partsA[index]) - parseSemverPart(partsB[index]);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

export async function loadSchema(): Promise<LoadedSchema> {
  try {
    const schema = await RemoteSchema.load({ ttlMs: SCHEMA_TTL_MS });
    return { schema, source: "remote" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `Warning: failed to load remote schema (${message}); using bundled schema.`
    );
    return { schema: BundledSchema.shared, source: "bundled" };
  }
}

export function warnIfSpecNewer(schema: DecodoSchema): void {
  if (!schema.version) {
    return;
  }

  if (compareSemver(schema.version, BUNDLED_SPEC_VERSION) > 0) {
    console.error(
      `Warning: remote schema v${schema.version} is newer than bundled v${BUNDLED_SPEC_VERSION}; some parameters may be unsupported.`
    );
  }
}
