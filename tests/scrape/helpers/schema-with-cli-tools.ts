import {
  BundledSchema,
  type DecodoSchema,
  type FlowSchema,
  type IrSurfaceTool,
} from "@decodo/sdk-ts";

export const TASK_TOOLS: IrSurfaceTool[] = [
  {
    name: "task_status",
    description: "Show the status of an async task as JSON",
    flow: "task",
    step: "status",
    descriptions: { id: "Task id" },
  },
  {
    name: "task_results",
    description: "Print the result of an async task",
    flow: "task",
    step: "results",
    descriptions: { id: "Task id" },
  },
];

export function schemaWithCliTools(
  tools: IrSurfaceTool[] = TASK_TOOLS
): DecodoSchema {
  const schema = Object.create(BundledSchema.shared) as FlowSchema;
  schema.getSurface = (client) => (client === "cli" ? { tools } : undefined);
  return schema;
}
