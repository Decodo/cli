import { writeFileSync } from "node:fs";

export function writeTextOutput(
  text: string,
  options: { output?: string }
): void {
  if (options.output !== undefined) {
    writeFileSync(options.output, text, "utf8");
    return;
  }

  process.stdout.write(`${text}\n`);
}
