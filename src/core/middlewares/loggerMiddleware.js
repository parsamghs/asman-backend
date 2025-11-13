const logger = require('../config/winston');
const socketEvents = require('../../socket/socketevents');
const pool = require('../config/db');

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', async () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1e6;

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
        logger.error('خطا در گرفتن dealer_code:', err.message);
      }
    }
    

    try {
      await pool.query(
        `INSERT INTO server_logs 
         (method, path, status_code, duration, dealer_name, dealer_code)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.method,
          req.originalUrl,
          res.statusCode,
          Math.round(durationMs),
          dealerName,
          dealerCode
        ]
      );

      socketEvents.emit('serverLogsUpdated');

      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${dealerName} - ${dealerCode} - ${Math.round(durationMs)}ms`);

    } catch (err) {
      logger.error('خطا در ذخیره لاگ در دیتابیس:', err.message);
    }
  });

  next();
}

module.exports = requestLogger;
