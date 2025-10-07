const cron = require("node-cron");
const sendBackupToEita = require("./backupSender");

function scheduleBackup() {
  console.log("🕒 Eita backup scheduler started...");

  cron.schedule("0 3 */3 * *", () => {
    console.log("📤 Sending scheduled database backup (every 3 days)...");
    sendBackupToEita();
  });

  sendBackupToEita();
}

module.exports = scheduleBackup;
