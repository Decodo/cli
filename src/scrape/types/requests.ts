export interface ScrapeRequest {
  query?: string;
  target: string;
  url?: string;
  [key: string]: unknown;
}
