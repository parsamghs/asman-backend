const express = require('express');
const router = express.Router();

router.use('/lost-orders-report', require('./ReportsRoute/LostOrderReportRoute'));

router.use('/orders-report', require('./ReportsRoute/OrdersReport'))

module.exports = router;