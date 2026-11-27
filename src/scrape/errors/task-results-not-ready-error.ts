export class TaskResultsNotReadyError extends Error {
  readonly flow: string;
  readonly taskId: string;

  constructor(flow: string, taskId: string) {
    super(
      `${flow} ${taskId} has no results yet. Run \`decodo ${flow} results ${taskId} --wait\` to wait for them.`
    );
    this.name = "TaskResultsNotReadyError";
    this.flow = flow;
    this.taskId = taskId;
  }
}
