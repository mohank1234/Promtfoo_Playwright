require("../config/env");
const { reduceEvents, createLineBuffer } = require("./parser");
const HttpError = require("./httpError");

const STREAM_TIMEOUT_MS = Number(process.env.STREAM_TIMEOUT_MS) || 60000;

// Calls the conversation stream endpoint and consumes the response as a
// real chunked stream (not response.text()), parsing each NDJSON line as
// it arrives. Note: the backend can return HTTP 200/201 even when the
// underlying AI service failed (the failure shows up as an {"error":true}
// event inside the stream body), so HTTP status alone cannot be used to
// detect success/failure here - only the parsed event stream can.
//
// The timeout below covers the entire request (connect through final
// chunk), not just the initial response - a stream that starts but never
// finishes would otherwise hang the eval run indefinitely.
async function askAgent(token, question, agentId, chatId, onEvent) {
  const payload = {
    query: question,
    chat_id: chatId,
    selected_models: [process.env.MODEL],
    knowledge_ids: [],
    enable_think: process.env.ENABLE_THINK === "true",
    search_depth: null,
    isProxyChatid: false,
    edit_last_qa: false,
    agent_id: agentId,
    sts_status: null,
  };

  const url = process.env.API_BASE_URL + process.env.CONVERSATION_STREAM_PATH;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        Referer: `${process.env.API_BASE_URL}/chats/${chatId}?agent-id=${agentId}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.body) {
      const text = await response.text().catch(() => "");
      throw new HttpError(`Conversation stream returned no body (status ${response.status}): ${text.slice(0, 300)}`, response.status);
    }

    const events = [];
    const lineBuffer = createLineBuffer((evt) => {
      events.push(evt);
      if (onEvent) onEvent(evt);
    });

    const decoder = new TextDecoder("utf-8");
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lineBuffer.push(decoder.decode(value, { stream: true }));
    }
    lineBuffer.push(decoder.decode());
    lineBuffer.flush();

    if (events.length === 0) {
      throw new HttpError(`Conversation stream returned no parseable events (status ${response.status})`, response.status);
    }

    return reduceEvents(events);
  } catch (err) {
    if (err.name === "AbortError") {
      const timeoutErr = new Error(`Conversation stream timed out after ${STREAM_TIMEOUT_MS}ms`);
      timeoutErr.name = "AbortError";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = askAgent;
