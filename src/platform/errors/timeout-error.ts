export class TimeoutError extends Error {
  constructor(message = "The request timed out.") {
    super(message);
    this.name = "TimeoutError";
  }
}
