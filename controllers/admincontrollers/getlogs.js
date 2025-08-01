const pool = require('../../db');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.getLogs = async (req, res) => {
  const userRole = req.user?.role;

  if (userRole !== 'مدیریت') {
    return res.status(403).json({ error: 'دسترسی غیرمجاز' });
  }

  try {
    const result = await pool.query(`
      SELECT id, log_time, action, message, user_id ,user_name
      FROM logs
      ORDER BY log_time DESC
    `);

    const logs = result.rows.map((log) => {
      const localMoment = moment(log.log_time).tz('Asia/Tehran');

      return {
        id: log.id,
        uses_id: log.user_id,
        action: log.action,
        message: log.message,
        user_name:log.user_name,
        date: localMoment.format('jYYYY/jMM/jDD'),
        time: localMoment.format('hh:mm:ss'),
      };
    });

    res.status(200).json({ logs });
  } catch (err) {
    console.error('خطا در دریافت لاگ‌ها:', err);
    res.status(500).json({ error: 'خطای سرور در دریافت لاگ‌ها' });
  }
};
