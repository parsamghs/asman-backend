const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {getRemainingSubscription} = require('../../controllers/dealerscontrollers/getremainingsubscription');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت','پذیرش','انباردار','حسابدار'), UpdateStats, getRemainingSubscription);


module.exports = router;
