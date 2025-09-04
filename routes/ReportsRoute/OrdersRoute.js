const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {exportOrdersExcel} = require('../../controllers/reportcontrollers/ordersreport');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت', 'انباردار'), UpdateStats, exportOrdersExcel);


module.exports = router;