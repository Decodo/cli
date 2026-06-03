import { writeFileSync } from "node:fs";
import { EXIT } from "./constants.js";

export const BINARY_TTY_ERROR =
  "Refusing to write binary data to a TTY. Use -o <file> or pipe to a file.";

export function writeBinaryOutput(
  bytes: Buffer,
  options: { output?: string }
): void {
  if (options.output !== undefined) {
    writeFileSync(options.output, bytes);
    return;
  }

  if (process.stdout.isTTY) {
    console.error(`Error: ${BINARY_TTY_ERROR}`);
    process.exit(EXIT.USAGE);
  }

  process.stdout.write(bytes);
}
