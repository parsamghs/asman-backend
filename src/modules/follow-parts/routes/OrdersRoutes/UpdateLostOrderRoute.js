const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {updateLostOrder} = require('../../controllers/orderscontrollers/updatelostorder');


router.patch('/:id', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت'), UpdateStats, updateLostOrder);


module.exports = router;