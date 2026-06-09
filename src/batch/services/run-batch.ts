import type { BatchItem } from "../types/batch-item.js";
import type { BatchResult, BatchSummary } from "../types/batch-result.js";
import { toErrorRecord } from "./to-error-record.js";

export interface RunBatchOptions {
  /** Maximum number of workers running concurrently (clamped to >= 1). */
  concurrency: number;
  /** Lazily produced inputs; pulled one at a time as workers free up. */
  items: AsyncIterable<BatchItem>;
  /** Invoked once per item, in completion order. Never called concurrently. */
  onResult: (result: BatchResult) => void | Promise<void>;
  /** Runs a single item; its resolved value becomes the success payload. */
  worker: (item: BatchItem) => Promise<unknown>;
}

const noop = (): void => {
  // Intentionally empty: used to swallow lock-chain rejections.
};

/**
 * Run a batch of inputs through `worker` with bounded concurrency. A failure in
 * one item is captured as an error record and does not abort the batch; results
 * are emitted via `onResult` as each item settles. Returns a run summary.
 */
export async function runBatch({
  items,
  concurrency,
  worker,
  onResult,
}: RunBatchOptions): Promise<BatchSummary> {
  const summary: BatchSummary = { total: 0, succeeded: 0, failed: 0 };
  const iterator = items[Symbol.asyncIterator]();

  // Serialise pulls from the iterator: async iterators must not have
  // overlapping next() calls.
  let pullLock: Promise<unknown> = Promise.resolve();
  function nextItem(): Promise<IteratorResult<BatchItem>> {
    const pending = pullLock.then(() => iterator.next());
    pullLock = pending.then(noop, noop);
    return pending;
  }

  // Serialise emissions so onResult is never re-entered concurrently.
  let emitLock: Promise<unknown> = Promise.resolve();
  function emit(result: BatchResult): Promise<unknown> {
    emitLock = emitLock.then(() => onResult(result));
    return emitLock;
  }

  async function drain(): Promise<void> {
    while (true) {
      const next = await nextItem();
      if (next.done) {
        return;
      }

      const item = next.value;
      summary.total++;

      try {
        const data = await worker(item);
        summary.succeeded++;
        await emit({ ...item, ok: true, data });
      } catch (err) {
        summary.failed++;
        await emit({ ...item, ok: false, error: toErrorRecord(err) });
      }
    }
  }

  const workerCount = Math.max(1, Math.floor(concurrency));
  await Promise.all(Array.from({ length: workerCount }, () => drain()));
  await emitLock;

  return summary;
}
