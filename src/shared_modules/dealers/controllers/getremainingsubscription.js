const pool = require('../../../../core/config/db');

exports.getRemainingSubscription = async (req, res) => {
  try {
    const { dealer_id } = req.user;

    if (!dealer_id) {
      return res.status(403).json({ message: 'شما به نمایندگی‌ای اختصاص داده نشده‌اید.' });
    }

    const result = await pool.query(
      'SELECT remaining_subscription, dealer_name, dealer_code FROM dealers WHERE id = $1',
      [dealer_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'نمایندگی یافت نشد.' });
    }

    const { remaining_subscription, dealer_name, dealer_code } = result.rows[0];

    res.json({
      dealer_id,
      dealer_name,
      dealer_code,
      remaining_subscription,
    });

  } catch (error) {
    console.error('خطا در گرفتن remaining_subscription:', error);
    res.status(500).json({ message: 'خطای سرور در دریافت میزان اشتراک' });
  }
};
