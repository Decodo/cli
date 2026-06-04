import type { DecodoSchema } from "@decodo/sdk-ts";
import { type Command, Option } from "commander";
import type { JSONSchema4 } from "json-schema";
import { attachScrapeOutputOptions } from "../../output/commands/attach-output-options.js";
import type { TargetCommandConfig } from "../types/target-command.js";
import { snakeToCamel, snakeToKebab } from "./naming.js";
import { getPrimaryInputField } from "./primary-input.js";

function formatOptionHelp(propertySchema: JSONSchema4): string {
  if (propertySchema.description) {
    return propertySchema.description;
  }

  if (propertySchema.enum) {
    return `enum: ${propertySchema.enum.map(String).join("|")}`;
  }

  if (propertySchema.type === "number" || propertySchema.type === "integer") {
    const bounds =
      propertySchema.minimum !== undefined ||
      propertySchema.maximum !== undefined
        ? ` (${propertySchema.minimum ?? "…"}–${propertySchema.maximum ?? "…"})`
        : "";
    return `${propertySchema.type}${bounds}`;
  }

  return String(propertySchema.type ?? "value");
}

function addPropertyOption(
  command: Command,
  field: string,
  propertySchema: JSONSchema4
): void {
  const kebabFlag = snakeToKebab(field);
  const help = formatOptionHelp(propertySchema);

  if (propertySchema.type === "boolean") {
    command.option(`--${kebabFlag}`, help);
    return;
  }

  if (propertySchema.enum) {
    command.addOption(
      new Option(`--${kebabFlag} <value>`, help).choices(
        propertySchema.enum.map(String)
      )
    );
    return;
  }

  if (propertySchema.type === "integer") {
    command.option(`--${kebabFlag} <n>`, help, (value: string) =>
      Number.parseInt(value, 10)
    );
    return;
  }

  if (propertySchema.type === "number") {
    command.option(`--${kebabFlag} <n>`, help, (value: string) =>
      Number.parseFloat(value)
    );
    return;
  }

  command.option(`--${kebabFlag} <value>`, help);
}

export function configureTargetCommand(
  command: Command,
  target: string,
  schema: DecodoSchema
): TargetCommandConfig {
  const parameterSchema = schema.getTargetParameterSchema(target);
  const primaryField = getPrimaryInputField(parameterSchema);

  if (primaryField) {
    const primarySchema = parameterSchema?.properties?.[primaryField] as
      | JSONSchema4
      | undefined;
    const inputHelp =
      primarySchema?.description ?? `Primary ${primaryField} input`;
    command.argument("<input>", inputHelp);
  }

  const optionFields = Object.keys(parameterSchema?.properties ?? {}).filter(
    (field) => field !== "target" && field !== primaryField
  );

  for (const field of optionFields) {
    const propertySchema = parameterSchema?.properties?.[field] as JSONSchema4;
    addPropertyOption(command, field, propertySchema);
  }

  attachScrapeOutputOptions(command);

  return { target, primaryField, optionFields };
}

export function buildScrapeBody(
  target: string,
  input: string | undefined,
  options: Record<string, unknown>,
  config: TargetCommandConfig
): Record<string, unknown> {
  const body: Record<string, unknown> = { target };

  if (config.primaryField) {
    if (input === undefined) {
      throw new Error(`Missing required input for ${config.primaryField}.`);
    }
    body[config.primaryField] = input;
  }

  for (const field of config.optionFields) {
    const value = options[snakeToCamel(field)];
    if (value !== undefined) {
      body[field] = value;
    }
  }

  return body;
}

export function getTargetCommandConfig(
  target: string,
  schema: DecodoSchema
): TargetCommandConfig {
  const parameterSchema = schema.getTargetParameterSchema(target);
  const primaryField = getPrimaryInputField(parameterSchema);
  const optionFields = Object.keys(parameterSchema?.properties ?? {}).filter(
    (field) => field !== "target" && field !== primaryField
  );

  return { target, primaryField, optionFields };
}
