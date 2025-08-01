const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {getLogs} = require('../../controllers/admincontrollers/getlogs');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت'), UpdateStats, getLogs);


module.exports = router;
