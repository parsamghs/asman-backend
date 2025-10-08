const logger = require('../config/winston');
const axios = require('axios');
const pool = require('../db');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded
    ? forwarded.split(',')[0].trim()
    : req.connection.remoteAddress || req.ip;
  return rawIp.replace(/^::ffff:/, '');
}

async function logLocation(ip) {
  try {
    const { data } = await axios.get(`https://ipwho.is/${ip}`);
    if (data.success) return `${data.city}, ${data.region}, ${data.country}`;
    return 'Unknown';
  } catch {
    return 'GeoIP Error';
  }
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', async () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1e6;

    const ip = getClientIp(req);
    const dealerName = req.user?.dealer_name || 'Unknown';
    let dealerCode = 'Unknown';

    if (req.user?.dealer_id) {
      try {
        const { rows } = await pool.query(
          'SELECT dealer_code FROM dealers WHERE id = $1',
          [req.user.dealer_id]
        );
        if (rows.length) dealerCode = rows[0].dealer_code;
      } catch (err) {
        logger.error('❌ خطا در گرفتن dealer_code:', err.message);
      }
    }

    try {
      await pool.query(
        `INSERT INTO server_logs 
         (method, path, status_code, ip, duration, dealer_name, dealer_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.method,
          req.originalUrl,
          res.statusCode,
          ip,
          Math.round(durationMs),
          dealerName,
          dealerCode
        ]
      );

      if (res.statusCode >= 400) {
        const errMsg = res.locals.errorMessage || 'Unknown Error';
        logger.error(
          `${req.method} ${req.originalUrl} ${res.statusCode} - ${dealerName} - ${dealerCode} - ${Math.round(durationMs)}ms - ❌ ${errMsg}`
        );
      } else {
        logger.info(
          `${req.method} ${req.originalUrl} ${res.statusCode} - ${dealerName} - ${dealerCode} - ${Math.round(durationMs)}ms`
        );
      }

    } catch (err) {
      logger.error('❌ خطا در ذخیره لاگ در دیتابیس:', err.message);
    }
  });

  next();
}

module.exports = requestLogger;
