const { exec } = require("child_process");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

const TOKEN = process.env.EITA_TOKEN;
const CHAT_ID = process.env.EITA_CHAT_ID;
const DB_URL = process.env.PROD_DB_URL;

function getFormattedDate() {
  const date = new Date();
  const fa = date.toLocaleDateString("fa-IR");
  return fa.replace(/\//g, "-");
}

async function sendBackupToEita() {

  try {
    const date = getFormattedDate();
    const outputFile = `/tmp/db_backup_${date}.dump`;
    const dumpCommand = `pg_dump --format=custom --file="${outputFile}" "${DB_URL}"`;

    exec(dumpCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Backup failed:", error.message);
        return;
      }
      if (stderr) console.warn("⚠️ pg_dump warning:", stderr);

      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("file", fs.createReadStream(outputFile), `db_backup_${date}.dump`);
      formData.append("caption", `بکاپ از دیتابیس تا تاریخ ${date}`);

      const url = `https://eitaayar.ir/api/${TOKEN}/sendFile`;

      const res = await axios.post(url, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
      });

      if (res.data.ok) {
        console.log('\x1b[32m%s\x1b[0m',`Backup sent successfully to Eita! (${date})`);
      } else {
        console.error("❌ Eita API error:", res.data);
      }

      fs.unlinkSync(outputFile);
    });
  } catch (err) {
    console.error("❌ Error sending backup:", err.message);
  }
}

module.exports = sendBackupToEita;
