// Error shape carrying an HTTP status code, so callers (provider.js's retry
// and 401-refresh logic) can branch on status without parsing message text.
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

module.exports = HttpError;
