const express = require('express');
const cors = require('cors');
const requestLogger = require('../middlewares/loggerMiddleware');
const { apiLimiter } = require('../middlewares/rateLimiter');

function setupExpress() {
    const app = express();

    app.set('trust proxy', false);
    app.use(cors());
    app.use(express.json());
    app.use(requestLogger);
    app.use(apiLimiter);

    return app;
}

module.exports = setupExpress;
