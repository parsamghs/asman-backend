const express = require('express');
const router = express.Router();

router.use('/utc-date', require('./DateRoutes/GetUtcDate'));

module.exports = router;