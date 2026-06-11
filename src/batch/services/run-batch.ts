import type { BatchItem } from "../types/batch-item.js";
import type { BatchResult, BatchSummary } from "../types/batch-result.js";
import { toErrorRecord } from "./to-error-record.js";

export interface RunBatchOptions {
  concurrency: number;
  items: AsyncIterable<BatchItem>;
  onResult: (result: BatchResult) => void | Promise<void>;
  worker: (item: BatchItem) => Promise<unknown>;
}

const noop = (): undefined => undefined;

export async function runBatch({
  items,
  concurrency,
  worker,
  onResult,
}: RunBatchOptions): Promise<BatchSummary> {
  const summary: BatchSummary = { total: 0, succeeded: 0, failed: 0 };
  const iterator = items[Symbol.asyncIterator]();

  let pullLock: Promise<unknown> = Promise.resolve();
  function nextItem(): Promise<IteratorResult<BatchItem>> {
    const pending = pullLock.then(() => iterator.next());
    pullLock = pending.then(noop, noop);
    return pending;
  }

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
