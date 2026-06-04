import { statSync } from "node:fs";
import { join } from "node:path";

export function resolveOutputFilePath(
  outputPath: string,
  defaultFileName: string
): string {
  try {
    if (statSync(outputPath).isDirectory()) {
      return join(outputPath, defaultFileName);
    }
  } catch {
    // Path missing or inaccessible — treat as a file path.
  }

  return outputPath;
}
