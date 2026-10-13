import type { JsonOutputOptions } from "../../output/types/json-output-options.js";

export interface SearchOptions extends JsonOutputOptions {
  geo?: string;
  locale?: string;
  page?: number;
}
