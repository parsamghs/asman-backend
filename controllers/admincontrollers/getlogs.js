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

    const { startDate, endDate, user_name } = req.query;

    const startDateMiladi = startDate ? moment(startDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD') : null;
    const endDateMiladi = endDate ? moment(endDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD') : null;

    const params = [];
    let whereClauses = [];

    if (dealerId) {
      params.push(dealerId);
      whereClauses.push(`dealer_id = $${params.length}`);
    }

    if (startDateMiladi) {
      params.push(startDateMiladi);
      whereClauses.push(`log_time >= $${params.length}`);
    }

    if (endDateMiladi) {
      params.push(endDateMiladi);
      whereClauses.push(`log_time <= $${params.length}`);
    }

    if (user_name) {
      params.push(`%${user_name}%`);
      whereClauses.push(`user_name ILIKE $${params.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM logs ${whereSQL}`;
    const countResult = await pool.query(countQuery, params);
    const totalLogs = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalLogs / limit);

    params.push(limit, offset);
    const dataQuery = `
      SELECT id, log_time, action, message, user_id, user_name
      FROM logs
      ${whereSQL}
      ORDER BY log_time DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const result = await pool.query(dataQuery, params);

    const logs = result.rows.map((log) => {
      const localMoment = moment(log.log_time).tz('Asia/Tehran');
      return {
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        message: log.message,
        user_name: log.user_name,
        date: localMoment.format('jYYYY/jMM/jDD'),
        time: localMoment.format('HH:mm'),
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
