// An error that knows which HTTP status to send. Throw it anywhere in a route
// (e.g. `throw new HttpError(404, 'Campaign not found')`) and the error handler turns it into a response.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
