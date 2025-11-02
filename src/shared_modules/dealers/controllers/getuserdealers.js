const pool = require('../../../core/config/db');
const jwt = require('jsonwebtoken');

exports.getUserDealers = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'توکن ارسال نشده یا معتبر نیست.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'توکن نامعتبر است.' });
    }

    const userId = decoded.id;

    const dealersRes = await pool.query(
      `SELECT d.id as dealer_id, d.dealer_name, d.dealer_code
       FROM user_dealers ud
       JOIN dealers d ON ud.dealer_id = d.id
       WHERE ud.user_id = $1`,
      [userId]
    );

    if (dealersRes.rowCount === 0) {
      return res.status(404).json({ message: 'نمایندگی‌ای برای کاربر یافت نشد.' });
    }

    res.json({
      dealers: dealersRes.rows
    });

  } catch (err) {
    console.error('🔴 خطا در گرفتن نمایندگی‌ها:', err);
    res.status(500).json({ message: 'خطای سرور' });
  }
};
