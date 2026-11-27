import { describe, expect, it } from "vitest";
import { TaskFailedError } from "../../../src/scrape/errors/task-failed-error.js";

describe("TaskFailedError", () => {
  it("names the task and its status", () => {
    const err = new TaskFailedError("123", "faulted");

    expect(err.message).toBe("Task 123 ended with status faulted.");
    expect(err.name).toBe("TaskFailedError");
    expect(err.taskId).toBe("123");
    expect(err.status).toBe("faulted");
  });
});
