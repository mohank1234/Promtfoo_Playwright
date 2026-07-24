const { ENV } = require("../config/env");
const login = require("./login");
const createChat = require("./createChat");
const askAgent = require("./askAgent");
const agents = require("./agentMap");

// Login once per eval run and reuse the token across all test cases.
let tokenPromise = null;
function getToken() {
  if (!tokenPromise) {
    tokenPromise = login().catch((err) => {
      tokenPromise = null;
      throw err;
    });
  }
  return tokenPromise;
}

// Agent resolution precedence (most specific wins):
//   1. a per-row "agent" var (e.g. an "Agent" column in the dataset) -
//      lets one dataset route different questions to different agents
//   2. the AGENT environment variable (e.g. `AGENT=LEGAL npm run eval`) -
//      lets you switch agents for a whole run without editing any file
//   3. `config.agent` in promptfooconfig.yaml - the file-level default
//   4. "GENERAL" as a last-resort fallback
function resolveAgent(context, config) {
  const key = String(
    (context && context.vars && context.vars.agent) ||
      process.env.AGENT ||
      (config && config.agent) ||
      "GENERAL"
  ).toUpperCase();
  const agentId = agents[key];
  if (!agentId) {
    throw new Error(`Unknown agent "${key}". Valid agents: ${Object.keys(agents).join(", ")}`);
  }
  return { agentKey: key, agentId };
}

// Custom Promptfoo provider for a multi-agent RAG chat API (see mock-server/
// for the fictional "Cortex Assist" target this template is wired to).
// Flow per test case: Login (cached) -> Create Chat -> Ask Agent -> Parse -> Return.
// See resolveAgent() above for the ways to pick which agent gets benchmarked.
class RagAgentProvider {
  constructor(options = {}) {
    this.providerId = options.id || "rag-agent-benchmark";
    this.config = options.config || {};
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    let agentKey, agentId, chatId;
    try {
      ({ agentKey, agentId } = resolveAgent(context, this.config));

      const token = await getToken();
      chatId = await createChat(token, agentId);
      const result = await askAgent(token, prompt, agentId, chatId);

      const metadata = {
        environment: ENV,
        agent: agentKey,
        agentId,
        chatId,
        references: result.references,
        metrics: result.metrics,
        accuracy: result.accuracy,
      };

      if (result.error) {
        return { error: result.error, output: result.answer || "", metadata };
      }

      return { output: result.answer, metadata };
    } catch (err) {
      return {
        error: err.message || String(err),
        metadata: { environment: ENV, agent: agentKey, agentId, chatId },
      };
    }
  }
}

module.exports = RagAgentProvider;
