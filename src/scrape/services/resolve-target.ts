import type { DecodoSchema } from "@decodo/sdk-ts";
import { ValidationError } from "@decodo/sdk-ts";
import { kebabToSnake } from "./naming.js";

export function resolveTarget(
  name: string | undefined,
  schema: DecodoSchema,
  defaultTarget: string
): string {
  if (!name) {
    return defaultTarget;
  }

  const candidates = [name, kebabToSnake(name)];
  const targets = schema.listTargets();

  for (const candidate of candidates) {
    if (targets.includes(candidate)) {
      return candidate;
    }
  }

  throw new ValidationError(`Unknown scrape target: ${name}`);
}
