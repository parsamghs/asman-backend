const express = require('express');
const router = express.Router();

router.use('/dealers/subscription', require('./dealers/routes/GetRemainingSubscriptionRoute'));

router.use('/utcdate', require('./utc/route/GetUtcDate'));

module.exports = router;
