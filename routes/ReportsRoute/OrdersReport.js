const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {downloadOrdersReport} = require('../../controllers/reportcontrollers/ordersreport');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت', 'انباردار', 'پذیرش', 'حسابدار'), UpdateStats, downloadOrdersReport);


module.exports = router;