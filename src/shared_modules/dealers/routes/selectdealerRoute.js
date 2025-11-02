const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
// const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const {selectDealer} = require('../controllers/selectdealer');


router.post('/', authMiddleware, roleMiddleware('مدیریت'), UpdateStats, selectDealer);


module.exports = router;