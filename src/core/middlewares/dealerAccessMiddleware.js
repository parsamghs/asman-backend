const jwt = require('jsonwebtoken');

const dealerAccessMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'توکن موجود نیست.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'توکن نامعتبر است.' });
    }

    const decoded = jwt.decode(token);

    if (!decoded || !decoded.dealer_id) {
      return res.status(400).json({ message: 'توکن نامعتبر یا اطلاعات نمایندگی موجود نیست.' });
    }

    const { dealer_id, remaining_subscription } = decoded;

    if (remaining_subscription === undefined) {
      return res.status(400).json({ message: 'میزان اشتراک در توکن موجود نیست.' });
    }

    if (remaining_subscription <= 0) {
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
