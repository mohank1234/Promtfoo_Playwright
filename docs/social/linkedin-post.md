# LinkedIn post

Copy-paste ready. Swap in your repo link before posting. Attach `linkedin-workflow.png`
(in this same folder) as the post image — a workflow-diagram render of the actual
pipeline: Login → Create Chat → Ask Agent → Parse Stream → Grade Answer → Export Report.

---

🚀 Built an open-source benchmark framework for testing multi-agent RAG chat APIs — powered by Promptfoo.

Evaluating a RAG-based AI agent isn't like evaluating a single LLM call. You need to log in, open a chat session, route the question to the right specialized agent, consume a streaming response, and then judge whether the answer was actually *correct* — not just well-formed.

So I built a framework that handles the whole pipeline end-to-end:

🔀 Multi-agent routing — one dataset, six specialized agents (HR, Legal, Finance, IT, Sales, General), resolved per-row, per-run, or per-environment, no code changes required

📡 Real streaming — parses chunked NDJSON incrementally as it arrives, not a naive `response.text()`, because that's how production chat APIs actually behave

🧠 Semantic grading — an LLM rubric grades intent and key facts against a reference answer instead of brittle string matching, with 0–100 partial credit

⚙️ Environment-driven config — flip between dev / staging / production with a single env var, zero file edits, fails fast on typos

📊 Spreadsheet round-trip — results are exported back into the original .csv/.xlsx shape, so non-engineers can review a benchmark run without touching a terminal

It's fully self-contained: a fictional mock API and a 120-question sample dataset ship with the repo, so anyone can clone it and run the full pipeline in minutes with zero real credentials.

Two integration lessons I baked in after hitting them for real: some backends silently accept a malformed request instead of rejecting it (much harder to debug than a clean 400), and streaming responses can return HTTP 200 while an error is buried inside the event stream — so status codes alone are never enough to trust.

Check it out, fork it, point it at your own agent API 👇
[GitHub link]

#AI #LLM #RAG #Promptfoo #SoftwareEngineering #OpenSource #AIEngineering #LLMOps
