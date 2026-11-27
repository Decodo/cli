export interface TaskWaitOptions {
  pollInterval?: number;
  timeout?: number;
  wait?: boolean;
}

export interface AsyncOptions extends TaskWaitOptions {
  async?: boolean;
}
