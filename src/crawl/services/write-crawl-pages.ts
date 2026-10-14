import { writeFileSync } from "node:fs";
import type { CrawlPage } from "@decodo/sdk-ts";

export function writeCrawlPages(pages: CrawlPage[], output?: string): void {
  const text = pages.map((page) => `${JSON.stringify(page)}\n`).join("");

  if (output !== undefined) {
    writeFileSync(output, text, "utf8");
    return;
  }

  process.stdout.write(text);
}
