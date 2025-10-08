const axios = require("axios");
require("dotenv").config();

const TOKEN = process.env.EITA_TOKEN;
const CHAT_ID = process.env.EITA_CHAT_ID;

async function sendLogToEita(level, message) {
  try {
    const text = `🚨 *${level.toUpperCase()} LOG* 🚨\n\n${message.slice(0, 3800)}`;
    const url = `https://eitaayar.ir/api/${TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("❌ Failed to send log to Eita:", err.message);
  }
}

module.exports = sendLogToEita;
