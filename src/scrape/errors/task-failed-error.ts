export class TaskFailedError extends Error {
  readonly flow: string;
  readonly status: string;
  readonly taskId: string;

  constructor(flow: string, taskId: string, status: string) {
    super(`${flow} ${taskId} ended with status ${status}.`);
    this.name = "TaskFailedError";
    this.flow = flow;
    this.taskId = taskId;
    this.status = status;
  }
}
