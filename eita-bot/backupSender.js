const { exec } = require("child_process");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

const TOKEN = process.env.EITA_TOKEN;
const CHAT_ID = "server_backup";
const DB_URL = process.env.PROD_DB_URL;

async function sendBackupToEita() {
  console.log("📤 Creating PostgreSQL binary backup...");

  try {
    const outputFile = "/tmp/db_backup.dump"; // فایل موقت روی سرور
    const dumpCommand = `pg_dump --format=custom --file="${outputFile}" "${DB_URL}"`;

    exec(dumpCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Backup failed:", error.message);
        return;
      }
      if (stderr) console.warn("⚠️ pg_dump warning:", stderr);

      console.log("📦 Backup created, preparing to send...");

      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("file", fs.createReadStream(outputFile), "db_backup.dump");
      formData.append("caption", "🧱 بکاپ باینری برای pgAdmin");

      const url = `https://eitaayar.ir/api/${TOKEN}/sendFile`;

      const res = await axios.post(url, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
      });

      if (res.data.ok) {
        console.log("✅ Backup sent successfully to Eita!");
      } else {
        console.error("❌ Eita API error:", res.data);
      }

      fs.unlinkSync(outputFile); // پاک‌کردن فایل موقت بعد از ارسال
    });
  } catch (err) {
    console.error("❌ Error sending backup:", err.message);
  }
}

module.exports = sendBackupToEita;
