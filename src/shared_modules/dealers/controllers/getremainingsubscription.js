const jwt = require('jsonwebtoken');

exports.getRemainingSubscription = async (req, res) => {
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
      return res.status(403).json({ message: 'توکن نامعتبر یا اطلاعات نمایندگی موجود نیست.' });
    }

    const { dealer_id, dealer_name, dealer_code, remaining_subscription } = decoded;

    if (remaining_subscription === undefined) {
      return res.status(400).json({ message: 'میزان اشتراک در توکن موجود نیست.' });
    }

    res.json({
      dealer_id,
      dealer_name,
      dealer_code,
      remaining_subscription,
    });

  } catch (error) {
    console.error('خطا در گرفتن remaining_subscription از توکن:', error);
    res.status(500).json({ message: 'خطای سرور در دریافت میزان اشتراک' });
  }
};
