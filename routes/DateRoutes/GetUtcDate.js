const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {getTimes} = require('../../controllers/datecontrollers/getutcdate');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت','حسابدار','انباردار','پذیرش'), UpdateStats, getTimes);


module.exports = router;
