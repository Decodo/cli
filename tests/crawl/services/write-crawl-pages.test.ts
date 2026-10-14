import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CrawlPage } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeCrawlPages } from "../../../src/crawl/services/write-crawl-pages.js";

const PAGES = [
  { url: "https://example.com/", content: "home" },
  { url: "https://example.com/about", content: "about" },
] as CrawlPage[];

const NDJSON =
  '{"url":"https://example.com/","content":"home"}\n' +
  '{"url":"https://example.com/about","content":"about"}\n';

describe("writeCrawlPages", () => {
  let written: string | undefined;

  beforeEach(() => {
    written = undefined;
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written = String(chunk);
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes one page per line to stdout", () => {
    writeCrawlPages(PAGES);
    expect(written).toBe(NDJSON);
  });

  it("writes NDJSON to a file with -o", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-crawl-"));
    const path = join(dir, "pages.ndjson");

    try {
      writeCrawlPages(PAGES, path);
      expect(readFileSync(path, "utf8")).toBe(NDJSON);
      expect(written).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
