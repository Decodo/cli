export function snakeToKebab(value: string): string {
  return value.replaceAll("_", "-");
}

export function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );
}
