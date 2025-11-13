const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const {getTimes} = require('../controller/getutcdate');


router.get('/', authMiddleware, roleMiddleware('مدیریت','حسابدار','انباردار','پذیرش'), UpdateStats, getTimes);


module.exports = router;
