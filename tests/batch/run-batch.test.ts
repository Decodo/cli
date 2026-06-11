import { ValidationError } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { runBatch } from "../../src/batch/services/run-batch.js";
import type { BatchItem } from "../../src/batch/types/batch-item.js";
import type { BatchResult } from "../../src/batch/types/batch-result.js";

async function* toAsync(inputs: string[]): AsyncGenerator<BatchItem> {
  let index = 0;
  for (const input of inputs) {
    await Promise.resolve();
    yield { index, input };
    index++;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("runBatch", () => {
  it("runs every item and emits success records", async () => {
    const results: BatchResult[] = [];

    const summary = await runBatch({
      items: toAsync(["a", "b", "c"]),
      concurrency: 2,
      worker: (item) => Promise.resolve(item.input.toUpperCase()),
      onResult: (result) => {
        results.push(result);
      },
    });

    expect(summary).toEqual({ total: 3, succeeded: 3, failed: 0 });
    expect(results.map((r) => r.index).sort()).toEqual([0, 1, 2]);
    const a = results.find((r) => r.input === "a");
    expect(a).toMatchObject({ ok: true, data: "A" });
  });

  it("captures per-item errors without aborting the batch", async () => {
    const results: BatchResult[] = [];

    const summary = await runBatch({
      items: toAsync(["ok-1", "boom", "ok-2"]),
      concurrency: 3,
      worker: (item) => {
        if (item.input === "boom") {
          throw new ValidationError("bad input");
        }
        return Promise.resolve(item.input);
      },
      onResult: (result) => {
        results.push(result);
      },
    });

    expect(summary).toEqual({ total: 3, succeeded: 2, failed: 1 });
    const failure = results.find((r) => !r.ok);
    expect(failure).toMatchObject({
      ok: false,
      input: "boom",
      error: { class: "ValidationError", message: "bad input" },
    });
  });

  it("never exceeds the configured concurrency", async () => {
    let active = 0;
    let peak = 0;

    await runBatch({
      items: toAsync(["1", "2", "3", "4", "5", "6"]),
      concurrency: 2,
      worker: async () => {
        active++;
        peak = Math.max(peak, active);
        await delay(5);
        active--;
      },
      onResult: () => undefined,
    });

    expect(peak).toBeLessThanOrEqual(2);
    expect(peak).toBeGreaterThan(0);
  });
});
