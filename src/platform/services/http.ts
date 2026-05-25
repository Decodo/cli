import { AuthenticationError } from "../errors/authentication-error.js";
import { DecodoError } from "../errors/decodo-error.js";
import { RateLimitError } from "../errors/rate-limit-error.js";
import { TimeoutError } from "../errors/timeout-error.js";
import { ValidationError } from "../errors/validation-error.js";
import type { ErrorResponse, HttpClientConfig } from "../types/http.js";

const TRAILING_SLASHES = /\/+$/;

export class HttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeoutMs: number;
  private readonly integrationHeader: string;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(TRAILING_SLASHES, "");
    this.timeoutMs = config.timeoutMs;
    this.integrationHeader = config.integrationHeader;

    if (config.auth.type === "basic") {
      this.authHeader = `Basic ${config.auth.token}`;
    } else {
      this.authHeader = config.auth.apiKey;
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const init: RequestInit = {
        method,
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-integration": this.integrationHeader,
        },
        signal: controller.signal,
      };

      if (body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const res = await fetch(url, init);

      if (res.ok) {
        if (res.status === 204) {
          return undefined as T;
        }
        return (await res.json()) as T;
      }

      let errorBody: ErrorResponse | undefined;
      try {
        errorBody = (await res.json()) as ErrorResponse;
      } catch {
        // response body wasn't JSON
      }

      this.throwForErrorResponse(res, errorBody);
    } catch (err) {
      this.rethrowRequestError(err, path);
    } finally {
      clearTimeout(timer);
    }
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  get<T>(path: string, query?: Record<string, string>): Promise<T> {
    if (query) {
      const params = new URLSearchParams(query);
      const qs = params.toString();
      if (qs) {
        return this.request<T>("GET", `${path}?${qs}`);
      }
    }
    return this.request<T>("GET", path);
  }

  private throwForErrorResponse(
    res: Response,
    errorBody: ErrorResponse | undefined
  ): never {
    const message = errorBody?.message ?? `HTTP ${res.status}`;

    if (res.status === 401 || res.status === 403) {
      throw new AuthenticationError(message);
    }
    if (res.status === 429) {
      throw new RateLimitError(message);
    }
    if (res.status === 422 || (res.status === 400 && errorBody?.errors)) {
      throw new ValidationError(message, errorBody?.errors);
    }
    throw new DecodoError(message, res.status, errorBody?.status);
  }

  private rethrowRequestError(err: unknown, path: string): never {
    if (err instanceof DecodoError) {
      throw err;
    }
    if (
      err instanceof TypeError &&
      (err as TypeError & { cause?: { code?: string } }).cause?.code ===
        "ABORT_ERR"
    ) {
      throw new TimeoutError(
        `Request to ${path} timed out after ${this.timeoutMs}ms`
      );
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError(
        `Request to ${path} timed out after ${this.timeoutMs}ms`
      );
    }
    throw err;
  }
}
