import type { JsonOutputOptions } from "../../output/types/json-output-options.js";
import type { OutputOptions } from "../../output/types/output-options.js";
import type { TaskWaitOptions } from "./async-options.js";

export type TaskStatusOptions = JsonOutputOptions;

export interface TaskResultsOptions extends OutputOptions, TaskWaitOptions {}
