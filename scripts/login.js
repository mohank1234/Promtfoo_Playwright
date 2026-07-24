require("../config/env");

const axios = require("axios");

async function login() {
    try {

        const response = await axios.post(
            process.env.LOGIN_URL,
            {
                email: process.env.EMAIL,
                password: process.env.PASSWORD,
                key: process.env.LOGIN_KEY
            },
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.access_token;

    } catch (err) {

        console.error("Login Failed");

        console.error(err.response?.data || err.message);

        throw err;

    }
}
module.exports = login;
