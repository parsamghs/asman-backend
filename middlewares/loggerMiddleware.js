const logger = require('../config/winston');
const axios = require('axios');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress || req.ip;
  return rawIp.replace(/^::ffff:/, '');
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', async () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1e6;

    const ip = getClientIp(req);

    if (
      ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.') ||
      ip.startsWith('127.') || ip.startsWith('100.') || ip === '::1'
    ) {
      logger.info(
        `${req.method} ${req.originalUrl} ${res.statusCode}`
      );
      return;
    }

    try {
      const { data } = await axios.get(`https://ipwho.is/${ip}`);

      if (data.success) {
        const location = `${data.city}, ${data.region}, ${data.country}`;
        logger.info(
          `${req.method} ${req.originalUrl} ${res.statusCode} - IP ${ip} - Location: ${location}`
        );
      } else {
        logger.info(
          `${req.method} ${req.originalUrl} ${res.statusCode} - IP ${ip} - Location: Unknown`
        );
      }
    } catch (err) {
      logger.warn(`GeoIP error for IP ${ip}: ${err.message}`);
      logger.info(
        `${req.method} ${req.originalUrl} ${res.statusCode} - IP ${ip} - Location: GeoIP Error`
      );
    }
  });

  next();
}

module.exports = requestLogger;
