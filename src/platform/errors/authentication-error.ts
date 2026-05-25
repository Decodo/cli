import { DecodoError } from "./decodo-error.js";

export class AuthenticationError extends DecodoError {
  constructor(message = "Authentication failed. Check your credentials.") {
    super(message, 401, "failed");
    this.name = "AuthenticationError";
  }
}
