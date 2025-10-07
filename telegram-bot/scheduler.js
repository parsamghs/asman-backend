const cron = require("node-cron");
const sendBackupToTelegram = require("./backupSender");

function scheduleBackup() {
  console.log("🕒 Telegram backup scheduler started...");

  cron.schedule("*/2 * * * *", () => {
    console.log("📦 Sending scheduled database backup...");
    sendBackupToTelegram();
  });

  sendBackupToTelegram();
}

module.exports = scheduleBackup;
