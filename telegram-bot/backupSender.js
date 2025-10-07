const { exec } = require("child_process");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const FormData = require("form-data");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const DB_URL = process.env.PROD_DB_URL;

async function sendBackupToTelegram() {
  console.log("📤 Creating PostgreSQL backup...");

  try {
    const dumpFilePath = path.join(os.tmpdir(), `db_backup_${Date.now()}.sql`);

    const dumpCommand = `pg_dump "${DB_URL}" -f "${dumpFilePath}"`;

    exec(dumpCommand, { maxBuffer: 1024 * 1024 * 100 }, async (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Backup failed:", error.message);
        return;
      }
      if (stderr) {
        console.warn("⚠️ pg_dump warning:", stderr);
      }

      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("document", fs.createReadStream(dumpFilePath));

      console.log("📨 Sending backup to Telegram...");

      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, formData, {
        headers: formData.getHeaders(),
      });

      console.log("✅ Backup sent successfully to Telegram!");

      fs.unlinkSync(dumpFilePath);
    });
  } catch (err) {
    console.error("❌ Error sending backup:", err.message);
  }
}

module.exports = sendBackupToTelegram;