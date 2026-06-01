import type { HttpClient } from "../../platform/services/http.js";
import type { ScrapeRequest } from "../types/requests.js";
import type { SyncResponse } from "../types/responses.js";

export class WebScrapingApi {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  scrape(params: ScrapeRequest): Promise<SyncResponse> {
    return this.http.post<SyncResponse>("/v2/scrape", params);
  }
}
