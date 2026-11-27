export class TaskFailedError extends Error {
  readonly status: string;
  readonly taskId: string;

  constructor(taskId: string, status: string) {
    super(`Task ${taskId} ended with status ${status}.`);
    this.name = "TaskFailedError";
    this.taskId = taskId;
    this.status = status;
  }
}
