export const PLAYGROUND_URL =
  "https://dashboard.decodo.com/web-data/playground";

export const AUTH_MISSING_MESSAGE = "No API key or auth token found.";

export const AUTH_TYPE = {
  TOKEN: "token",
  API_KEY: "apiKey",
} as const;

export const API_KEY_REQUIRED_MESSAGE =
  "This command needs a Web Data API key; a basic auth token cannot call it.";
