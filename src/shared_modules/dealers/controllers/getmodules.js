const pool = require('../../../core/config/db');

exports.getDealerModules = async (req, res) => {
  try {
    const { dealer_id } = req.user; 

    if (!dealer_id) {
      return res.status(400).json({ message: 'dealer_id یافت نشد' });
    }

    const result = await pool.query(
      `SELECT id, dealer_id, module, remaining_subscription, license
       FROM dealer_modules
       WHERE dealer_id = $1`,
      [dealer_id]
    );

    res.json({
      modules: result.rows
    });

  } catch (err) {
    console.error('🔴 خطا در دریافت ماژول‌های نمایندگی:', err);
    res.status(500).json({ message: 'خطای سرور در هنگام دریافت ماژول‌ها' });
  }
};
