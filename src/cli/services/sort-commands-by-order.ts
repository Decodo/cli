import type { Command } from "commander";

export const ROOT_COMMAND_ORDER = [
  "scrape",
  "search",
  "screenshot",
  "setup",
  "reset",
  "whoami",
  "targets",
] as const;

export function sortCommandsByOrder(
  commands: Command[],
  order: readonly string[] = ROOT_COMMAND_ORDER
): Command[] {
  const orderIndex = new Map(order.map((name, index) => [name, index]));
  const fallbackIndex = order.length;

  return [...commands].sort((a, b) => {
    const aIndex = orderIndex.get(a.name()) ?? fallbackIndex;
    const bIndex = orderIndex.get(b.name()) ?? fallbackIndex;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.name().localeCompare(b.name());
  });
}
