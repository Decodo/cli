export function uniqueName(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) {
    suffix++;
  }

  const candidate = `${base}-${suffix}`;
  used.add(candidate);
  return candidate;
}
