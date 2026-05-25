import { createScrapeClient } from './client.js';

export async function validateAuthToken(token: string): Promise<void> {
  const api = createScrapeClient(token);
  await api.scrape({ target: 'universal', url: 'https://ip.decodo.com' });
}
