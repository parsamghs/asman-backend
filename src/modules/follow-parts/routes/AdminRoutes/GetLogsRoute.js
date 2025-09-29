const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {getLogs} = require('../../controllers/admincontrollers/getlogs');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت'), UpdateStats, getLogs);


module.exports = router;
