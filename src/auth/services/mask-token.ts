export function maskToken(token: string): string {
  if (token.length <= 8) {
    return '****';
  }
  
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
