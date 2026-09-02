// Centralized environment loader. Every entrypoint (scripts/*.js, Tests/*.js)
// requires this instead of calling dotenv directly, so there is exactly one
// place that decides which environment's config gets loaded.
//
// Select the environment with APP_ENV (falls back to NODE_ENV, then
// "development"):
//   APP_ENV=staging npm run eval
//   $env:APP_ENV="staging"; npm run eval        # PowerShell
//
// Load order (later overrides earlier):
//   1. repo-root .env                - secrets shared across all environments
//                                       (this template has none needed - the
//                                       mock server requires no API keys -
//                                       but a real deployment might put a
//                                       shared LLM-grading API key here)
//   2. config/environments/<env>.env - everything environment-specific:
//                                       login, URLs, model, etc.
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ENV = (process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const envFilePath = path.join(__dirname, "environments", `${ENV}.env`);
if (!fs.existsSync(envFilePath)) {
  const available = fs
    .readdirSync(path.join(__dirname, "environments"))
    .filter((f) => f.endsWith(".env"))
    .map((f) => f.replace(/\.env$/, ""));
  throw new Error(
    `Unknown environment "${ENV}" (from APP_ENV/NODE_ENV) - no config/environments/${ENV}.env. ` +
      `Available environments: ${available.join(", ")}`
  );
}
dotenv.config({ path: envFilePath, override: true, quiet: true });

// staging.env/production.env ship as templates with literal "TODO" values
// (see README's "Pointing this at a real product") - catch an unedited
// template here, at startup, instead of letting it surface later as a
// confusing DNS/auth failure deep in login.js/createChat.js.
const REQUIRED_VARS = ["EMAIL", "PASSWORD", "LOGIN_KEY", "LOGIN_URL", "API_BASE_URL", "CONVERSATION_STREAM_PATH", "MODEL"];
const unset = REQUIRED_VARS.filter((key) => {
  const value = (process.env[key] || "").trim();
  return !value || value.toUpperCase() === "TODO";
});
if (unset.length > 0) {
  throw new Error(
    `config/environments/${ENV}.env is missing (or still has placeholder "TODO" values for): ${unset.join(", ")}. ` +
      `Fill in real values before running against "${ENV}" - see README's "Pointing this at a real product".`
  );
}

function loadAgentMap() {
  const agentsFilePath = path.join(__dirname, "environments", `${ENV}.agents.json`);
  if (!fs.existsSync(agentsFilePath)) {
    throw new Error(`Missing agent map for environment "${ENV}": ${agentsFilePath}`);
  }
  return JSON.parse(fs.readFileSync(agentsFilePath, "utf8"));
}

module.exports = { ENV, loadAgentMap };
