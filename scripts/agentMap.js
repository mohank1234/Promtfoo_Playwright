// Agent name -> Agent ID map for the current environment (APP_ENV). Backed
// by config/environments/<env>.agents.json - see config/env.js.
const { loadAgentMap } = require("../config/env");

module.exports = loadAgentMap();
