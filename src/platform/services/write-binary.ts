import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CliUsageError, handleCliError } from "./handle-cli-error.js";
import { resolveOutputFilePath } from "./resolve-output-file.js";

export const BINARY_TTY_ERROR =
  "Refusing to write binary data to a TTY. Use -o <file> or pipe to a file.";

export function writeBinaryOutput(
  bytes: Buffer,
  options: { output?: string; defaultFileName?: string }
): void {
  if (options.output !== undefined) {
    const filePath =
      options.defaultFileName === undefined
        ? options.output
        : resolveOutputFilePath(options.output, options.defaultFileName);
    writeFileSync(filePath, bytes);
    console.error(`Wrote ${resolve(filePath)}`);
    return;
  }

  if (process.stdout.isTTY) {
    handleCliError(new CliUsageError(BINARY_TTY_ERROR));
  }

  process.stdout.write(bytes);
}
