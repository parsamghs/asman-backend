const pool = require('../config/db');
const moment = require('moment-timezone');

const UpdateStats = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const userId = Number(req.user.id);

      const tehranTime = moment().tz("Asia/Tehran").format('YYYY-MM-DD HH:mm:ss');

      await pool.query(
        `INSERT INTO users_stats (id, last_active)
         VALUES ($1, $2)
         ON CONFLICT (id)
         DO UPDATE SET last_active = EXCLUDED.last_active`,
        [userId, tehranTime]
      );
    }
  } catch (err) {
    console.error('Error updating last_active:', err.message);
  }
  next();
};

module.exports = UpdateStats;
