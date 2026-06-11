import type { DecodoSchema } from "@decodo/sdk-ts";

const NO_GROUP = "None";

export function resolveTargetGroup(
  schema: DecodoSchema,
  target: string
): string | undefined {
  const group = schema.getTargetMeta(target)?.group;
  if (!group || group === NO_GROUP) {
    return;
  }
  return group;
}
