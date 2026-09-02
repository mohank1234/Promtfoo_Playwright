// Bounded retry for transient failures only: connection errors, request
// timeouts, and 5xx/429 HTTP responses. Deliberately does NOT retry other
// 4xx errors or an {error:true} event inside a successful stream - those
// are real results the benchmark is meant to capture and grade (see
// mock-server/server.js's deliberate mix of correct/degraded/off-target
// answers), not glitches to paper over.
const HttpError = require("./httpError");

function isRetryable(err) {
  if (err && err.name === "AbortError") return true; // timeout
  if (err instanceof HttpError) return err.status >= 500 || err.status === 429;
  const code = err && err.code;
  return code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "EAI_AGAIN";
}

async function withRetry(fn, { retries = 2, baseDelayMs = 500, onRetry } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      if (onRetry) onRetry(err, attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
      attempt++;
    }
  }
}

module.exports = { withRetry, isRetryable };
