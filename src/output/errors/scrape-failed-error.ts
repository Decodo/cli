export class ScrapeFailedError extends Error {
  readonly statusCode: number | undefined;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ScrapeFailedError";
    this.statusCode = statusCode;
  }
}
