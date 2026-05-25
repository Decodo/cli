import { DecodoError } from './decodo-error.js';

export class RateLimitError extends DecodoError {
  constructor(message = 'Rate limit exceeded. Slow down your request rate.') {
    super(message, 429, 'failed');
    this.name = 'RateLimitError';
  }
}
