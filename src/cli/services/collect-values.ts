export function collectValues(
  value: string,
  previous: string[] = []
): string[] {
  return [...previous, value];
}
