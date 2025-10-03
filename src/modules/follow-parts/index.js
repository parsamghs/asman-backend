const express = require('express');
const router = express.Router();

router.use('/admin', require('./routes/AdminCentralRoute'));

router.use('/orders', require('./routes/OrdersCentralRoute'));

router.use('/reports', require('./routes/ReportsCentralRoute'));

router.use('/setting', require('./routes/SettingCentralRoute'));

module.exports = router;
