import type { JsonOutputOptions } from "../../output/types/json-output-options.js";
import type { SiteOptions } from "./site-options.js";

export interface MapOptions extends JsonOutputOptions, SiteOptions {
  full?: boolean;
  jsRendering?: boolean;
}
