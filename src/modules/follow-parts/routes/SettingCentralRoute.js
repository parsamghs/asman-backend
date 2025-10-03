const express = require('express');
const router = express.Router();

router.use('/update-setting', require('./SettingRoutes/UpdateSettingRoute'));

router.use('/get-setting', require('./SettingRoutes/GetSettingRoute'));

module.exports = router;