import { AUTH_MISSING_MESSAGE } from "../constants.js";

export class AuthRequiredError extends Error {
  constructor(message = AUTH_MISSING_MESSAGE) {
    super(message);
    this.name = "AuthRequiredError";
  }
}
