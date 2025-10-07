const scheduleBackup = require("./schedule");

function initEitaBot() {
  console.log("📦 Eita backup service started...");
  scheduleBackup();
}

module.exports = initEitaBot;
