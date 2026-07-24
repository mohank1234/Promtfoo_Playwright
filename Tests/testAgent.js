require("../config/env");

const login = require("../scripts/login");
const createChat = require("../scripts/createChat");
const askAgent = require("../scripts/askAgent");
const agents = require("../scripts/agentMap");

(async () => {
    try {
        const token = await login();
        console.log("Login OK");

        const chatId = await createChat(token, agents.HR);
        console.log("Chat created:", chatId);

        const result = await askAgent(
            token,
            "How many vacation days do new employees get in their first year?",
            agents.HR,
            chatId
        );

        console.log("\n========== PARSED RESULT ==========\n");
        console.log("Answer:", result.answer);
        console.log("Accuracy:", result.accuracy);
        console.log("References:", result.references.length);
        console.log("Metrics:", result.metrics);
        if (result.error) {
            console.log("Error:", result.error);
        }
    } catch (err) {
        console.error(err.response?.data || err);
    }
})();
