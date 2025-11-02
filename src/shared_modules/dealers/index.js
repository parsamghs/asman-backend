const express = require('express');
const router = express.Router();

router.use('/subscription', require('./routes/GetRemainingSubscriptionRoute'));

router.use('/modules', require('./routes/getmodulesRoute'));

router.use('/select-module', require('./routes/selectmoduleRoute'));

router.use('/user-dealers', require('./routes/getuserDealesRoute'));

router.use('/select-dealer', require('./routes/selectdealerRoute'));

module.exports = router;