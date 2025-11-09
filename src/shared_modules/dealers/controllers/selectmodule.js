const pool = require('../../../core/config/db');
const jwt = require('jsonwebtoken');

exports.selectModule = async (req, res) => {
  try {
    const { module } = req.body;
    const decoded = req.user;

    if (!module) {
      return res.status(400).json({ message: 'نام ماژول (module) الزامی است.' });
    }

    const moduleRes = await pool.query(
      `SELECT id, dealer_id, module, remaining_subscription, license
       FROM dealer_modules
       WHERE module = $1 AND dealer_id = $2`,
      [module, decoded.dealer_id]
    );

    const moduleRecord = moduleRes.rows[0];

    if (!moduleRecord) {
      return res.status(404).json({ message: 'ماژول مورد نظر پیدا نشد.' });
    }

    if (!moduleRecord.license) {
      return res.status(403).json({ message: 'این ماژول برای نمایندگی شما فعال نیست.' });
    }

    if (moduleRecord.remaining_subscription <= 0) {
      return res.status(403).json({ message: 'اشتراک این ماژول به پایان رسیده است.' });
    }

    const tokenPayload = {
      id: decoded.id,
      role: decoded.role,
      dealer_id: decoded.dealer_id,
      dealer_name: decoded.dealer_name,
      category: decoded.category,
      module: moduleRecord.module,
      remaining_subscription: moduleRecord.remaining_subscription
    };

    const newToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.json({
      token: newToken,
      module: moduleRecord.module,
      remaining_subscription: moduleRecord.remaining_subscription
    });

  } catch (err) {
    console.error('🔴 خطا در انتخاب ماژول:', err);
    res.status(500).json({ message: 'خطای سرور در هنگام انتخاب ماژول' });
  }
};
