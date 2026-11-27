export class TaskResultsNotReadyError extends Error {
  readonly taskId: string;

  constructor(taskId: string) {
    super(
      `Task ${taskId} has no results yet. Run \`decodo task results ${taskId} --wait\` to wait for them.`
    );
    this.name = "TaskResultsNotReadyError";
    this.taskId = taskId;
  }
}
