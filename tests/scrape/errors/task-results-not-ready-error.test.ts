import { describe, expect, it } from "vitest";
import { TaskResultsNotReadyError } from "../../../src/scrape/errors/task-results-not-ready-error.js";

describe("TaskResultsNotReadyError", () => {
  it("names the task and the command that waits for it", () => {
    const err = new TaskResultsNotReadyError("task", "123");

    expect(err.message).toBe(
      "task 123 has no results yet. Run `decodo task results 123 --wait` to wait for them."
    );
    expect(err.name).toBe("TaskResultsNotReadyError");
    expect(err.flow).toBe("task");
    expect(err.taskId).toBe("123");
  });
});
