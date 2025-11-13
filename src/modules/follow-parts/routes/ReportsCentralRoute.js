const express = require('express');
const router = express.Router();

const authMiddleware = require('../../../core/middlewares/authMiddleware');
const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');

const { downloadLostOrdersReport } = require('../controllers/reportcontrollers/lostordersreport');
const { exportOrdersExcel } = require('../controllers/reportcontrollers/ordersreport');
const { exportLogsExcel } = require('../controllers/reportcontrollers/logsreport');

const reportsmiddlewares = [
    authMiddleware,
    dealerAccessMiddleware,
    roleMiddleware('مدیریت', 'انباردار'),
    UpdateStats
];

router.get('/lost-orders-report', reportsmiddlewares, downloadLostOrdersReport);
router.get('/orders-report', reportsmiddlewares, exportOrdersExcel);
router.get('/logs-report', reportsmiddlewares, exportLogsExcel);

module.exports = router;
