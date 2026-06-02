import type { JSONSchema4 } from "json-schema";
import { PRIMARY_INPUT_FIELDS, type PrimaryInputField } from "../constants.js";

export function getPrimaryInputField(
  parameterSchema: JSONSchema4 | undefined
): PrimaryInputField | undefined {
  const properties = parameterSchema?.properties ?? {};

  for (const field of PRIMARY_INPUT_FIELDS) {
    if (field in properties) {
      return field;
    }
  }

  return;
}
