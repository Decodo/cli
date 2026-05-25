export class DecodoError extends Error {
  public readonly statusCode: number;
  public readonly apiStatus: string | undefined;

  constructor(message: string, statusCode: number, apiStatus?: string) {
    super(message);
    this.name = 'DecodoError';
    this.statusCode = statusCode;
    this.apiStatus = apiStatus;
  }
}
