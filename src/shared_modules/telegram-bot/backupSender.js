const { exec } = require("child_process");
const FormData = require("form-data");
const axios = require("axios");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const DB_URL = process.env.DEV_DB_URL;

async function sendBackupToTelegram() {
  console.log("📤 Creating PostgreSQL backup...");

  try {
    const dumpCommand = `pg_dump "${DB_URL}"`;

    exec(dumpCommand, { maxBuffer: 1024 * 1024 * 100 }, async (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Backup failed:", error.message);
        return;
      }
      if (stderr) {
        console.warn("⚠️ pg_dump warning:", stderr);
      }

      const fileBuffer = Buffer.from(stdout, "utf-8");

      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("document", fileBuffer, {
        filename: `db_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.sql`,
        contentType: "application/sql",
      });

      console.log("📨 Sending backup to Telegram...");

      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, formData, {
        headers: formData.getHeaders(),
      });

      console.log("✅ Backup sent successfully to Telegram!");
    });
  } catch (err) {
    console.error("❌ Error sending backup:", err.message);
  }
}

module.exports = sendBackupToTelegram;
