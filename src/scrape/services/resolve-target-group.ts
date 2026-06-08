import type { DecodoSchema } from "@decodo/sdk-ts";

const MISSING_GROUP = "None";

function isValidGroup(group: string | undefined): group is string {
  return group !== undefined && group.length > 0 && group !== MISSING_GROUP;
}

function inferGroupFromPrefix(
  schema: DecodoSchema,
  target: string
): string | undefined {
  const prefix = target.split("_")[0];
  if (prefix.length === 0) {
    return;
  }

  for (const other of schema.listTargets()) {
    if (other === target || !other.startsWith(`${prefix}_`)) {
      continue;
    }

    const otherGroup = schema.getTargetMeta(other)?.group;
    if (isValidGroup(otherGroup)) {
      return otherGroup;
    }
  }
}

export function resolveTargetGroup(
  schema: DecodoSchema,
  target: string
): string {
  const group = schema.getTargetMeta(target)?.group;
  if (isValidGroup(group)) {
    return group;
  }

  const fromPrefix = inferGroupFromPrefix(schema, target);
  if (fromPrefix !== undefined) {
    return fromPrefix;
  }

  if (target.startsWith("universal")) {
    const universalGroup = schema.getTargetMeta("universal")?.group;
    if (isValidGroup(universalGroup)) {
      return universalGroup;
    }
  }

  if (target.includes("ecommerce")) {
    const ecommerceGroup = schema.getTargetMeta("ecommerce")?.group;
    if (isValidGroup(ecommerceGroup)) {
      return ecommerceGroup;
    }
  }

  return "Other";
}
