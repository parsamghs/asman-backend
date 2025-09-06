const pool = require('../../db');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.getUsersWithStatus = async (req, res) => {
  try {
    const dealer_id = req.user?.dealer_id;
    if (!dealer_id) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز: شناسه نمایندگی یافت نشد.' });
    }

    const result = await pool.query(`
      SELECT 
        l.id, l.name, l.last_name, l.code_meli, l.role,
        s.last_active
      FROM login l
      LEFT JOIN users_stats s ON l.id = s.id
      WHERE l.dealer_id = $1
    `, [dealer_id]);

    const now = momentTZ.tz('Asia/Tehran');

    const users = result.rows.map((user) => {
      let isOnline = false;
      let lastActiveDate = null;
      let lastActiveTime = null;

      if (user.last_active) {
        const localMoment = moment(user.last_active).tz('Asia/Tehran');

        const diffMinutes = now.diff(localMoment, 'minutes');
        isOnline = diffMinutes <= 5;

        lastActiveDate = localMoment.format('jYYYY/jMM/jDD');
        lastActiveTime = localMoment.format('HH:mm:ss');
      }

      return {
        name: user.name,
        last_name: user.last_name,
        code_meli: user.code_meli.toString().padStart(10, '0'),
        role: user.role,
        last_active_date: lastActiveDate,
        last_active_time: lastActiveTime,
        online: isOnline,
      };
    });

    res.status(200).json(users);
  } catch (err) {
    console.error('🔴 خطا در getUsersWithStatus:', err);
    res.status(500).json({ message: 'خطا در دریافت وضعیت کاربران' });
  }
};
