import { BundledSchema, type DecodoSchema, RemoteSchema } from "@decodo/sdk-ts";
import { SCHEMA_TTL_MS } from "../constants.js";

export async function loadSchema(): Promise<DecodoSchema> {
  try {
    return await RemoteSchema.load({ ttlMs: SCHEMA_TTL_MS });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `Warning: failed to load remote schema (${message}); using bundled schema.`
    );
    return BundledSchema.shared;
  }
}
