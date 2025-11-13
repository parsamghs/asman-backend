const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const {getTimes} = require('../controller/getutcdate');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت','حسابدار','انباردار','پذیرش'), UpdateStats, getTimes);


module.exports = router;
