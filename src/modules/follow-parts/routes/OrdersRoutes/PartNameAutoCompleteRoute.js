const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {suggestPartsByName} = require('../../controllers/orderscontrollers/partnameautocomplete');


router.get('/:partname_id', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت'), UpdateStats, suggestPartsByName);


module.exports = router;