const scheduleBackup = require("./scheduler");

function initTelegramBot() {
  console.log("📦 Telegram bot service started...");
  scheduleBackup();
}

module.exports = initTelegramBot;
