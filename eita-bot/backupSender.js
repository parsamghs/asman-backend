const { exec } = require("child_process");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const TOKEN = process.env.EITA_TOKEN;
const CHAT_ID = "server_backup";
const DB_URL = process.env.PROD_DB_URL;

async function sendBackupToEita() {
  console.log("📤 Creating PostgreSQL backup...");

  try {
    const dumpCommand = `pg_dump "${DB_URL}"`;
    exec(dumpCommand, { maxBuffer: 1024 * 1024 * 100 }, async (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Backup failed:", error.message);
        return;
      }
      if (stderr) console.warn("⚠️ pg_dump warning:", stderr);

      const fileBuffer = Buffer.from(stdout, "utf-8");
      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("file", fileBuffer, "db_backup.sql");
      formData.append("caption", "📦 بکاپ جدید از دیتابیس سرور");

      console.log("📨 Sending backup to Eita...");

      const url = `https://eitaayar.ir/api/${TOKEN}/sendFile`;
      const res = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });

      if (res.data.ok) {
        console.log("✅ Backup sent successfully to Eita!");
      } else {
        console.error("❌ Eita API error:", res.data);
      }
    });
  } catch (err) {
    console.error("❌ Error sending backup:", err.message);
  }
}

module.exports = sendBackupToEita;
