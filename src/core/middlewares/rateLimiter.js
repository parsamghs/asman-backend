const rateLimit = require('express-rate-limit');

const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const apiLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'درخواست‌های زیادی ارسال کرده‌اید. لطفاً بعداً تلاش کنید.',
  },
});

module.exports = { apiLimiter };