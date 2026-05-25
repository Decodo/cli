import { describe, expect, it } from 'vitest';

describe('maskToken', () => {
  it('masks long tokens', async () => {
    const { maskToken } = await import('../../../src/auth/services/mask-token.js');
    expect(maskToken('abcdefghijklmnop')).toBe('abcd...mnop');
  });

  it('masks short tokens', async () => {
    const { maskToken } = await import('../../../src/auth/services/mask-token.js');
    expect(maskToken('short')).toBe('****');
  });
});
