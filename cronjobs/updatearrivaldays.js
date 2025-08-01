const cron = require('node-cron');
const pool = require('../db');

async function decreaseEstimatedDays() {
  const client = await pool.connect();
  try {
    console.log('🔄 شروع کاهش estimated_arrival_days سفارش‌ها...');
    const result = await client.query(`
      UPDATE orders
      SET estimated_arrival_days = estimated_arrival_days - 1
      RETURNING id
    `);

    console.log(`✅ ${result.rowCount} سفارش به‌روزرسانی شد.`);
    return { updated: result.rowCount };
  } catch (err) {
    console.error('❌ خطا:', err);
    throw err;
  } finally {
    client.release();
  }
}
cron.schedule('0 0 * * *', decreaseEstimatedDays);
module.exports = { decreaseEstimatedDays };