export function mask(value: string, offset: number, length: number): string {
  if (length >= 0) {
    if (value.length <= offset) {
      return "****";
    }

    return `${value.slice(0, offset)}...`;
  }

  const prefixLen = offset;
  const suffixLen = -length;

  if (value.length <= prefixLen + suffixLen) {
    return "****";
  }

  return `${value.slice(0, prefixLen)}...${value.slice(-suffixLen)}`;
}
