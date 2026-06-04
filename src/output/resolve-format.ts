import type { DecodoSchema } from "@decodo/sdk-ts";
import { ValidationError } from "@decodo/sdk-ts";
import type { OutputFormat, OutputOptions } from "./types.js";
import { OUTPUT_FORMATS } from "./types.js";

export function resolveDefaultFormat(
  target: string,
  schema: DecodoSchema
): OutputFormat {
  const parameterSchema = schema.getTargetParameterSchema(target);
  const properties = parameterSchema?.properties ?? {};

  if (properties.parse !== undefined) {
    return "json";
  }

  if (
    target === "universal" ||
    (properties.markdown !== undefined && properties.parse === undefined)
  ) {
    return "markdown";
  }

  return "json";
}

function parseExplicitFormat(value: string): OutputFormat {
  if ((OUTPUT_FORMATS as readonly string[]).includes(value)) {
    return value as OutputFormat;
  }

  throw new ValidationError(
    `Unknown output format: ${value}. Use one of: ${OUTPUT_FORMATS.join(", ")}.`
  );
}

export function resolveOutputFormat(
  options: OutputOptions,
  target: string,
  schema: DecodoSchema
): OutputFormat {
  if (options.format !== undefined) {
    return parseExplicitFormat(options.format);
  }

  if (options.html) {
    return "html";
  }

  if (options.json) {
    return "json";
  }

  return resolveDefaultFormat(target, schema);
}
