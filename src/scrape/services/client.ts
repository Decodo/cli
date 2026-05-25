import { HttpClient } from '../../platform/services/http.js';
import {
  DEFAULT_TIMEOUT_MS,
  INTEGRATION_HEADER,
  WEB_API_BASE_URL,
} from '../constants.js';
import { WebScrapingApi } from './web-scraping-api.js';

export function createScrapeClient(token: string): WebScrapingApi {
  return new WebScrapingApi(
    new HttpClient({
      baseUrl: WEB_API_BASE_URL,
      auth: { type: 'basic', token },
      timeoutMs: DEFAULT_TIMEOUT_MS,
      integrationHeader: INTEGRATION_HEADER,
    }),
  );
}
