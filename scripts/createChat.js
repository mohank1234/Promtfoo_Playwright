require("../config/env");
const { randomUUID } = require("crypto");
const HttpError = require("./httpError");
const fetchWithTimeout = require("./fetchWithTimeout");

const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 15000;

// IMPORTANT: /api/chats/create only accepts multipart/form-data.
// This is a deliberate, documented lesson baked into this project (see the
// mock server and README): a JSON body here is a common mistake when
// integrating with RAG chat APIs, and some real backends will accept it
// silently while quietly failing later, which is a much harder bug to
// track down than the mock server's explicit 400 rejection.
//
// The field name is "selectedAgentId", not "agentId".
async function createChat(token, agentId) {
  const form = new FormData();
  form.append("queryId", randomUUID());
  form.append("selectedAgentId", agentId);
  form.append("selectedModels", JSON.stringify([process.env.MODEL]));
  form.append("enable_think", process.env.ENABLE_THINK === "true" ? "true" : "false");
  form.append("deepResearch", "false");
  form.append("deeperResearch", "false");
  form.append("webSearch", "false");

  const response = await fetchWithTimeout(
    process.env.API_BASE_URL + "/api/chats/create",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: form,
    },
    TIMEOUT_MS
  );

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new HttpError(`Create chat returned non-JSON response (status ${response.status}): ${text.slice(0, 300)}`, response.status);
  }

  if (!response.ok || !data.id) {
    throw new HttpError(`Create chat failed (status ${response.status}): ${text.slice(0, 300)}`, response.status);
  }

  return data.id;
}

module.exports = createChat;
