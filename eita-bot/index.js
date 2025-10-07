const scheduleBackup = require("./scheduler");

function initEitaBot() {
  console.log("📦 Eita backup service started...");
  scheduleBackup();
}

module.exports = initEitaBot;
