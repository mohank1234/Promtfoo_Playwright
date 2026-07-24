require("../config/env");
const { randomUUID } = require("crypto");

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

  const response = await fetch(process.env.API_BASE_URL + "/api/chats/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: form,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error(`Create chat returned non-JSON response (status ${response.status}): ${text.slice(0, 300)}`);
  }

  if (!response.ok || !data.id) {
    throw new Error(`Create chat failed (status ${response.status}): ${text.slice(0, 300)}`);
  }

  return data.id;
}

module.exports = createChat;
