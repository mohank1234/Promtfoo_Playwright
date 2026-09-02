// fetch() has no built-in request timeout - without this, a hung mock/real
// server stalls the whole eval run with no way out. Wraps fetch with an
// AbortController and turns the resulting AbortError into a clearly-labeled
// timeout message.
async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      const timeoutErr = new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
      timeoutErr.name = "AbortError";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = fetchWithTimeout;
