const pool = require('../../db');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.getLogs = async (req, res) => {
  const userRole = req.user?.role;
  const dealerId = req.user?.dealer_id;

  if (userRole !== 'مدیریت') {
    return res.status(403).json({ error: 'دسترسی غیرمجاز' });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 300;
    const offset = (page - 1) * limit;

    const countQuery = dealerId
      ? 'SELECT COUNT(*) FROM logs WHERE dealer_id = $1'
      : 'SELECT COUNT(*) FROM logs';
    const countParams = dealerId ? [dealerId] : [];
    const countResult = await pool.query(countQuery, countParams);

    const totalLogs = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalLogs / limit);

    const dataQuery = dealerId
      ? `SELECT id, log_time, action, message, user_id, user_name
         FROM logs
         WHERE dealer_id = $1
         ORDER BY log_time DESC
         LIMIT $2 OFFSET $3`
      : `SELECT id, log_time, action, message, user_id, user_name
         FROM logs
         ORDER BY log_time DESC
         LIMIT $1 OFFSET $2`;

    const dataParams = dealerId
      ? [dealerId, limit, offset]
      : [limit, offset];

    const result = await pool.query(dataQuery, dataParams);

    const logs = result.rows.map((log) => {
      const localMoment = moment(log.log_time).tz('Asia/Tehran');
      return {
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        message: log.message,
        user_name: log.user_name,
        date: localMoment.format('jYYYY/jMM/jDD'),
        time: localMoment.format('HH:mm:ss'),
      };
    });

    res.status(200).json({
      page,
      limit,
      totalLogs,
      totalPages,
      logs,
    });
  } catch (err) {
    console.error('خطا در دریافت لاگ‌ها:', err);
    res.status(500).json({ error: 'خطای سرور در دریافت لاگ‌ها' });
  }
};
