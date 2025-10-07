const sendBackupToEita = require("./backupSender");

function scheduleBackup() {
  console.log("🕒 Eita backup scheduler started...");

  const interval = 2 * 60 * 1000;

  setInterval(() => {
    console.log("📤 Sending scheduled database backup...");
    sendBackupToEita();
  }, interval);

  sendBackupToEita();
}

module.exports = scheduleBackup;
