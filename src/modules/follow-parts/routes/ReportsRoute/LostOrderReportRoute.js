const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {downloadLostOrdersReport} = require('../../controllers/reportcontrollers/lostordersreport');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت', 'انباردار'), UpdateStats, downloadLostOrdersReport);


module.exports = router;