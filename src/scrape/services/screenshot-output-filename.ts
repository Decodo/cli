const DEFAULT_SCREENSHOT_FILENAME = "screenshot.png";

export function defaultScreenshotFilename(url: string | undefined): string {
  if (url === undefined || url.length === 0) {
    return DEFAULT_SCREENSHOT_FILENAME;
  }

  try {
    const hostname = new URL(url).hostname;
    const safe = hostname.replace(/[^a-zA-Z0-9.-]+/g, "-");
    if (safe.length > 0) {
      return `${safe}.png`;
    }
  } catch {
    // Fall through to default.
  }

  return DEFAULT_SCREENSHOT_FILENAME;
}
