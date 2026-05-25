import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../../src/platform/services/http.js';
import { AuthenticationError } from '../../../src/platform/errors/authentication-error.js';

describe('HttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends Basic auth and x-integration header on POST', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    } as Response);

    const client = new HttpClient({
      baseUrl: 'https://scraper-api.decodo.com',
      auth: { type: 'basic', token: 'abc123' },
      timeoutMs: 5000,
      integrationHeader: 'cli',
    });

    await client.post('/v2/scrape', { target: 'universal', url: 'https://example.com' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://scraper-api.decodo.com/v2/scrape',
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Basic abc123',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-integration': 'cli',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      target: 'universal',
      url: 'https://example.com',
    });
  });

  it('maps 401 responses to AuthenticationError', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized', status: 'failed' }),
    } as Response);

    const client = new HttpClient({
      baseUrl: 'https://scraper-api.decodo.com',
      auth: { type: 'basic', token: 'bad' },
      timeoutMs: 5000,
      integrationHeader: 'cli',
    });

    await expect(client.post('/v2/scrape', {})).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});
