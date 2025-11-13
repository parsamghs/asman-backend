const cron = require('node-cron');
const pool = require('../config/db');

async function decreaseRemainingSubscription() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE dealer_modules
      SET remaining_subscription = remaining_subscription - 1
      WHERE remaining_subscription > 0
      RETURNING id
    `);

    console.log(`✅ ${result.rowCount} نمایندگی به‌روزرسانی شد.`);
    return { updated: result.rowCount };
  } catch (err) {
    console.error('❌ خطا:', err);
    throw err;
  } finally {
    client.release();
  }
}

cron.schedule('0 0 * * *', decreaseRemainingSubscription);
module.exports = { decreaseRemainingSubscription };
