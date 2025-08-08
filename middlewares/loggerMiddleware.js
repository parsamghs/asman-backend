const morgan = require('morgan');
const logger = require('../config/winston');

const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms - IP :remote-addr', { stream });

module.exports = requestLogger;
