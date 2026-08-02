# Building a Production-Grade RAG Agent Benchmark Framework with Promptfoo

*A technical deep-dive into designing an evaluation pipeline for multi-agent RAG chat APIs — and the integration lessons that shaped it.*

## The problem

Evaluating a single LLM call is a solved problem: send a prompt, grade the completion, done. [Promptfoo](https://www.promptfoo.dev/) makes that trivial.

Evaluating a *RAG-based AI agent behind a real chat API* is a different animal. Before you can even ask a question, you typically need to:

1. Authenticate and get a session token
2. Open a chat session bound to a specific specialized agent
3. Send the question and consume a **streamed** response
4. Parse out the final answer, its citations, and any quality metrics the backend reports
5. Judge whether the answer was actually *correct* — not just well-formed

None of that is a single API call, and none of it is graded by exact-match string comparison. I built **RAG Agent Benchmark** to handle this whole pipeline, wired into Promptfoo as a custom provider, with a self-contained mock target API so the entire thing runs end-to-end with zero real credentials.

## Architecture at a glance

The framework is organized into four layers:

- **Centralized config** (`config/`) — one env var (`APP_ENV`) selects `development` / `staging` / `production`, each with its own URLs, credentials, and agent-ID map
- **API client** (`scripts/login.js`, `createChat.js`, `askAgent.js`, `parser.js`) — the actual login → create-chat → ask-agent → parse-stream flow
- **Benchmark layer** (`scripts/loadTests.js`, `provider.js`, `exportResults.js`) — bridges the dataset and API client into Promptfoo's test/provider model
- **Promptfoo** — runs the eval, grades each answer with an LLM rubric, and produces `report.html` / `eval.json`

A bundled mock server (`mock-server/`) implements a fictional multi-agent assistant, "Cortex Assist," well enough to exercise every part of this — including its rough edges.

## Lesson 1: `multipart/form-data`, not JSON

The chat-creation endpoint in the target API only accepts `multipart/form-data`. A JSON body isn't just wrong — depending on the backend, it can be silently accepted and ignored, which fails much later and much more confusingly than a clean rejection would.

```js
// scripts/createChat.js
const form = new FormData();
form.append("queryId", randomUUID());
form.append("selectedAgentId", agentId);
form.append("selectedModels", JSON.stringify([process.env.MODEL]));
// ...

const response = await fetch(process.env.API_BASE_URL + "/api/chats/create", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  body: form,
});
```

The mock server enforces this deliberately — a JSON body gets an explicit `400`, turning a subtle integration bug into an obvious one during development instead of production.

## Lesson 2: streaming NDJSON, not SSE, not `response.text()`

The conversation endpoint streams **newline-delimited JSON** over a chunked HTTP response — not Server-Sent Events, and not safe to buffer with `response.text()`. Each line is its own JSON event: `keep_alive` → `references` → `metrics` → `answer`.

```js
// scripts/askAgent.js
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  lineBuffer.push(decoder.decode(value, { stream: true }));
}
```

A small incremental line-buffer (`parser.js`) accumulates partial chunks across reads and emits complete JSON events as soon as a full line is available — so the parser never assumes a chunk boundary lines up with a JSON boundary, which it usually won't.

## Lesson 3: HTTP 200 doesn't mean success

The mock target can report an application-level failure — an unknown agent, a downstream AI-service error — while still returning **HTTP 200/201**. The failure only shows up as `{"error": true, "message": "..."}` inside the event stream itself.

```js
// parser.js
if (evt.error) {
  result.error = evt.message || evt.content || "Unknown AI service error";
}
```

This mirrors real backend behavior closely enough that treating status codes as the sole signal of success would have silently passed every one of these failures straight into the benchmark's "correct answer" bucket.

## Grading: semantic, not exact-match

Different wording, added correct context, or a more complete citation shouldn't fail a row — a materially wrong fact, a fabricated figure, or a missed contradiction should. So grading is delegated to an LLM rubric (`scripts/gradingRubricPrompt.json`), wired in once via Promptfoo's `defaultTest.options.rubricPrompt`, and applied identically to every test case:

```yaml
# promptfooconfig.yaml
defaultTest:
  options:
    rubricPrompt: file://scripts/gradingRubricPrompt.json
```

Each row gets a 0–100 score (partial credit, not just pass/fail) plus a pass/fail verdict and a reason string — all of which round-trip back into the exported spreadsheet.

## Multi-agent routing, three ways

The bundled dataset spans six specialized agents — HR, Legal, Finance, IT, Sales, General. Routing a question to the right one is resolved with a clear precedence order:

```js
// scripts/provider.js
function resolveAgent(context, config) {
  const key = String(
    (context && context.vars && context.vars.agent) ||   // 1. per-row "Agent" column
      process.env.AGENT ||                                 // 2. AGENT env var
      (config && config.agent) ||                           // 3. config.agent in promptfooconfig.yaml
      "GENERAL"                                              // 4. fallback
  ).toUpperCase();
  ...
}
```

That means the same framework supports three different workflows without touching code: benchmark one agent at a time (`AGENT=LEGAL npm run eval`), point a whole run at a separate dataset per agent, or — the bundled dataset's approach — mix everything into one spreadsheet and let each row's `Agent` column do the routing.

## A mock server that lies convincingly

A benchmark framework that only ever reports 100% pass isn't demonstrating anything. The mock server's `generateAnswer()` deliberately returns the correct answer ~72% of the time, a truncated/degraded answer ~14% of the time, and an off-target or hallucinated answer ~14% of the time — matched against the dataset by word overlap, then perturbed. That gives every eval run a believable, non-trivial score distribution, which is exactly what you want when validating that your grading pipeline actually *catches* mistakes rather than rubber-stamping everything.

## Getting results back to non-engineers

Every `npm run eval` writes a fully self-contained, timestamped folder:

```
reports/2026-07-24_14-30-00_development_default/
├── report.html                          # Promptfoo's interactive viewer
├── eval.json                            # raw eval output
└── Acme_Benchmark_Dataset-results.xlsx  # same shape as the input dataset
```

That last file matters more than it might look: `exportResults.js` reads the original `.csv`/`.xlsx` dataset back in, matches each row to its eval result by `(sheet, question)`, and fills in `Answer in Staging` / `Score` / `Pass-Fail` columns — so a benchmark run can be reviewed as a spreadsheet by anyone, not just someone comfortable reading a JSON eval log.

## Try it yourself

The whole thing is runnable in under a minute with zero real credentials:

```bash
npm install
cp .env.example .env        # OPENAI_API_KEY, used only for grading
npm run mock-server          # terminal 1
npm run eval                 # terminal 2
npm run report
```

Point it at a real deployment by editing `config/environments/<env>.env` and `.agents.json` — everything downstream (grading, reporting, export) is generic and doesn't change.

Repo: [GitHub link]

---

*If you're building or evaluating multi-agent RAG systems, I'd love to hear how you're approaching benchmarking — drop a comment or open an issue.*
