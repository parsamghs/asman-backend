const pool = require('../../db');

/**
 * 
 * @param {number} userId 
 * @param {string} action 
 * @param {string} message 
 */
const createLog = async (userId, action, message) => {
  try {
    const result = await pool.query(
      'SELECT name, last_name, dealer_id FROM login WHERE id = $1',
      [userId]
    );

    let userName = 'نامشخص';
    let dealerId = null;

    if (result.rows.length > 0) {
      const { name, last_name, dealer_id } = result.rows[0];
      userName = `${name} ${last_name}`;
      dealerId = dealer_id;
    }

    await pool.query(
      `
      INSERT INTO logs (user_id, action, message, user_name, dealer_id)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [userId, action, message, userName, dealerId]
    );
  } catch (err) {
    console.error('🔴 خطا در ثبت لاگ:', err);
  }
};

module.exports = createLog;
