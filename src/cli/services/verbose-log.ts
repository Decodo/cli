export function verboseLog(enabled: boolean, message: string): void {
  if (!enabled) {
    return;
  }

  process.stderr.write(`[verbose] ${message}\n`);
}
