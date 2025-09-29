const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {getSetting} = require('../../controllers/settingcontrollers/getsetting');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت', 'انباردار'), UpdateStats, getSetting);


module.exports = router;

