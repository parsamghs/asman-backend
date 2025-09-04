const express = require('express');
const router = express.Router();

router.use('/lost-orders-report', require('./ReportsRoute/LostOrderReportRoute'));

router.use('/orders-report', require('./ReportsRoute/OrdersRoute'));

router.use('/logs-report', require('./ReportsRoute/LogsReportRoute'));

module.exports = router;