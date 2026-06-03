const HTTP_URL_PATTERN = /^https?:\/\//i;

export function isHttpUrl(token: string): boolean {
  return HTTP_URL_PATTERN.test(token);
}

export function normalizeArgvForUrlShortcut(
  argv: string[],
  knownCommands: Set<string>
): string[] {
  if (argv.length < 3) {
    return argv;
  }

  const first = argv[2];
  if (first === undefined) {
    return argv;
  }

  if (first.startsWith("-")) {
    return argv;
  }

  if (knownCommands.has(first)) {
    return argv;
  }

  if (!isHttpUrl(first)) {
    return argv;
  }

  const normalized = [...argv];
  normalized.splice(2, 0, "scrape");
  return normalized;
}
