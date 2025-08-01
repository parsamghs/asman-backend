const bcrypt = require('bcrypt');
const pool = require('./db'); // مسیر اتصال به دیتابیس خودت

async function isHashed(password) {
  // بررسی ساده: bcrypt هش‌ها با $2a$ یا $2b$ شروع می‌شن و 60 کاراکتر هستن
  return typeof password === 'string' && password.startsWith('$2') && password.length === 60;
}

async function hashPasswordsIfNeeded() {
  try {
    const users = await pool.query('SELECT id, password FROM login');

    for (const user of users.rows) {
      const { id, password } = user;

      const hashed = await isHashed(password);

      if (!hashed) {
        const newHashedPassword = await bcrypt.hash(password, 10);

        await pool.query('UPDATE login SET password = $1 WHERE id = $2', [
          newHashedPassword,
          id,
        ]);

        console.log(`✅ Password hashed for user ID: ${id}`);
      } else {
        console.log(`⏭️ Already hashed, skipping ID: ${id}`);
      }
    }

    console.log('✅ Password check and hash complete.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

hashPasswordsIfNeeded();
