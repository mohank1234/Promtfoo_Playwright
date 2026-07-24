// Parses the conversation stream, which is newline-delimited JSON (NOT
// Server-Sent Events) with lines shaped like:
//   {"type":"keep_alive","model_name":"system","content":""}
//   {"type":"references","model_name":"...","content":[...]}
//   {"type":"metrics","model_name":"...","content":{"accuracy":100,...}}
//   {"type":"answer","model_name":"...","content":"final answer text"}
// On backend failure the stream instead contains a single error event:
//   {"model_name":"system","content":"Service was unavailable","error":true,
//    "message":"AI service error: 404 Not Found","type":"answer"}
// Note: the HTTP status can still be 200/201 even when this error event is
// present - only the parsed event stream tells you the call actually failed.

function reduceEvents(events) {
  const result = {
    answer: "",
    references: [],
    metrics: {},
    accuracy: null,
    error: null,
    events,
  };

  for (const evt of events) {
    if (!evt || typeof evt !== "object") continue;

    if (evt.error) {
      result.error = evt.message || evt.content || "Unknown AI service error";
    }

    switch (evt.type) {
      case "references":
        if (Array.isArray(evt.content)) result.references = evt.content;
        break;

      case "metrics":
        if (evt.content && typeof evt.content === "object") {
          result.metrics = evt.content;
          if (typeof evt.content.accuracy === "number") {
            result.accuracy = evt.content.accuracy;
          }
        }
        break;

      case "answer":
        if (typeof evt.content === "string") {
          result.answer += evt.content;
        }
        break;

      case "keep_alive":
      default:
        break;
    }
  }

  return result;
}

function parseAgentStream(raw) {
  const events = [];
  for (const line of String(raw).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (_) {
      // ignore partial/non-JSON lines
    }
  }
  return reduceEvents(events);
}

// Incremental NDJSON line reader for real streaming consumption.
// Buffers partial chunks across network reads and emits complete
// JSON events as soon as a full line is available.
function createLineBuffer(onEvent) {
  let buffer = "";
  return {
    push(chunk) {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          onEvent(JSON.parse(line));
        } catch (_) {
          // ignore malformed/partial line
        }
      }
    },
    flush() {
      const line = buffer.trim();
      buffer = "";
      if (!line) return;
      try {
        onEvent(JSON.parse(line));
      } catch (_) {
        // ignore trailing malformed line
      }
    },
  };
}

module.exports = { parseAgentStream, reduceEvents, createLineBuffer };
