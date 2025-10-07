const pool = require('../config/db');

const dealerAccessMiddleware = async (req, res, next) => {
  try {
    const { dealer_id, role } = req.user;

    if (!dealer_id) {
      return res.status(400).json({ message: 'کد نمایندگی کاربر موجود نیست.' });
    }

    const result = await pool.query(
      'SELECT remaining_subscription FROM dealers WHERE id = $1',
      [dealer_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'نمایندگی یافت نشد.' });
    }

    const remainingSubscription = result.rows[0].remaining_subscription;

    if (remainingSubscription <= 0) {
      return res.status(403).json({ message: 'اشتراک شما تمام شده است. لطفاً برای تمدید اقدام کنید.' });
    }

    req.dealer_id = dealer_id;
    next();

  } catch (error) {
    console.error('خطا در dealerAccessMiddleware:', error);
    res.status(500).json({ message: 'خطای سرور در میدل‌ویر دسترسی نمایندگی' });
  }
};

module.exports = dealerAccessMiddleware;
