const pool = require('../../../../core/config/db');

exports.getSetting = async (req, res) => {
  try {
    const dealerId = req.user.dealer_id;

    const result = await pool.query(
      'SELECT * FROM setting WHERE dealer_id = $1 LIMIT 1',
      [dealerId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'هیچ اطلاعاتی یافت نشد.' });
    }

    const { dealer_id, ...settingWithoutDealerId } = result.rows[0];

    return res.status(200).json(settingWithoutDealerId);

  } catch (error) {
    console.error('خطا در دریافت اطلاعات تنظیمات:', error);
    return res.status(500).json({ message: 'خطای سرور هنگام دریافت تنظیمات.' });
  }
};
