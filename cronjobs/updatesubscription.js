const cron = require('node-cron');
const pool = require('../db');

async function decreaseRemainingSubscription() {
  const client = await pool.connect();
  try {
    console.log('🔄 شروع کاهش remaining_subscription نمایندگی‌ها...');
    const result = await client.query(`
      UPDATE dealers
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
