const MAX_SLUG_LENGTH = 100;

function slugify(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

/**
 * Derive a filesystem-safe base name (no extension) for a batch item. URLs are
 * slugged from host + path; anything else falls back to the row index.
 */
export function batchItemFilename(input: string, index: number): string {
  try {
    const url = new URL(input);
    const slug = slugify(`${url.hostname}${url.pathname}`);
    if (slug.length > 0) {
      return slug;
    }
  } catch {
    // Not a URL — fall back to the row index below.
  }

  return `item-${index}`;
}
