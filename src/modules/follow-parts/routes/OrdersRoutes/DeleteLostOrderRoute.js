const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {deleteLostOrder} = require('../../controllers/orderscontrollers/deletelostorder');

router.delete('/:id', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار', 'مدیریت'), UpdateStats, deleteLostOrder);

module.exports = router;