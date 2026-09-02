require("../config/env");
const HttpError = require("./httpError");
const fetchWithTimeout = require("./fetchWithTimeout");

const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 15000;

async function login() {
  const response = await fetchWithTimeout(
    process.env.LOGIN_URL,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.EMAIL,
        password: process.env.PASSWORD,
        key: process.env.LOGIN_KEY,
      }),
    },
    TIMEOUT_MS
  );

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new HttpError(`Login returned non-JSON response (status ${response.status}): ${text.slice(0, 300)}`, response.status);
  }

  if (!response.ok || !data.access_token) {
    throw new HttpError(`Login failed (status ${response.status}): ${text.slice(0, 300)}`, response.status);
  }

  return data.access_token;
}

module.exports = login;
