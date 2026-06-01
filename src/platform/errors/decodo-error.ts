export class DecodoError extends Error {
  readonly statusCode: number;
  readonly apiStatus: string | undefined;

  constructor(message: string, statusCode: number, apiStatus?: string) {
    super(message);
    this.name = "DecodoError";
    this.statusCode = statusCode;
    this.apiStatus = apiStatus;
  }
}
