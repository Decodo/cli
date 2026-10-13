import { API_KEY_REQUIRED_MESSAGE } from "../constants.js";

export class ApiKeyRequiredError extends Error {
  constructor(message = API_KEY_REQUIRED_MESSAGE) {
    super(message);
    this.name = "ApiKeyRequiredError";
  }
}
