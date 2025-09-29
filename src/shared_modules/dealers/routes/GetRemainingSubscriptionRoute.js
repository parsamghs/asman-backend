const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const {getRemainingSubscription} = require('../controllers/getremainingsubscription');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت','پذیرش','انباردار','حسابدار'), UpdateStats, getRemainingSubscription);


module.exports = router;
