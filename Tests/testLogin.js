require("../config/env");
const login = require("../scripts/login");

(async () => {
    try {
        const token = await login();

        console.log("\nLogin Successful!\n");

        console.log(token);

    } catch (err) {

        console.error(err);

    }
})();
