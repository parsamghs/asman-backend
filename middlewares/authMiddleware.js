const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.split(' ')[0].toLowerCase() === 'bearer') {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'توکن ارسال نشده است.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      dealer_id: decoded.dealer_id,
      dealer_name: decoded.dealer_name,
      category: decoded.category
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'توکن منقضی شده است.' });
    }
    console.error('🔴 خطا در authMiddleware:', err);
    return res.status(401).json({ message: 'توکن نامعتبر است.' });
  }
};

module.exports = authMiddleware;
