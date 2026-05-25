export type ScrapeRequest = {
  target: string;
  url?: string;
  query?: string;
  [key: string]: unknown;
};
