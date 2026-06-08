import type { DecodoSchema } from "@decodo/sdk-ts";

export function applyRequestDefaults(
  body: Record<string, unknown>,
  target: string,
  schema: DecodoSchema
): void {
  const properties = schema.getTargetParameterSchema(target)?.properties ?? {};

  if (properties.parse !== undefined && body.parse === undefined) {
    body.parse = true;
  }

  if (properties.markdown !== undefined && body.markdown === undefined) {
    body.markdown = properties.parse === undefined;
  }
}
