const MAX_SLUG_LENGTH = 100;

function slugify(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

export function batchItemFilename(input: string, index: number): string {
  const fallback = `item-${index}`;
  try {
    const url = new URL(input);
    const slug = slugify(`${url.hostname}${url.pathname}`);
    return slug.length > 0 ? slug : fallback;
  } catch {
    return fallback;
  }
}
