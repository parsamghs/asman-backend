const express = require('express');
const router = express.Router();

router.use('/lost-orders-report', require('./ReportsRoute/LostOrderReportRoute'));

module.exports = router;