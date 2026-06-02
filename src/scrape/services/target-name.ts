export function toKebabCommand(target: string): string {
  return target.replaceAll("_", "-");
}

export function toSnakeTarget(commandName: string): string {
  return commandName.replaceAll("-", "_");
}
