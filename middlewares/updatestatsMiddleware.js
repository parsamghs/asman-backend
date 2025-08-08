const pool = require('../db');

const UpdateStats = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      await pool.query(
        `INSERT INTO users_stats (id, last_active)
         VALUES ($1, NOW())
         ON CONFLICT (id)
         DO UPDATE SET last_active = EXCLUDED.last_active`,
        [req.user.id]
      );
    }
  } catch (err) {
    console.error('Error updating last_active:', err);}
  next();
  };


module.exports = UpdateStats;
