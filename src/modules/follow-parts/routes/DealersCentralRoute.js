const express = require('express');
const router = express.Router();

router.use('/get-subscription',require('./DealerRoutes/GetRemainingSubscriptionRoute'));

module.exports = router;