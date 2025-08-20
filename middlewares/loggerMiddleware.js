const logger = require('../config/winston');
const axios = require('axios');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress || req.ip;
  return rawIp.replace(/^::ffff:/, '');
}

async function logLocation(ip) {
  try {
    const { data } = await axios.get(`https://ipwho.is/${ip}`);
    if (data.success) {
      return `${data.city}, ${data.region}, ${data.country}`;
    }
    return 'Unknown';
  } catch (err) {
    return 'GeoIP Error';
  }
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', async () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1e6;

    const ip = getClientIp(req);
    const dealerId = req.user?.dealer_id || 'Unknown';
    const dealerName = req.user?.dealer_name || 'Unknown';

    let location = 'Unknown';

    if (
      ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.') ||
      ip.startsWith('127.') || ip.startsWith('100.') || ip === '::1'
    ) {
      logger.info(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${dealerName}`
      );
      return;
    }

    location = await logLocation(ip);

    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${dealerName}`
    );
  });


  next();
}

module.exports = requestLogger;
