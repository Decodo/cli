import { DecodoError } from "./decodo-error.js";

export class ValidationError extends DecodoError {
  readonly errors: unknown[] | undefined;

  constructor(message: string, errors?: unknown[]) {
    super(message, 422, "failed");
    this.name = "ValidationError";
    this.errors = errors;
  }
}
