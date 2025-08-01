const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {deleteLostOrder} = require('../../controllers/orderscontrollers/deletelostorder');

router.delete('/:id', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار', 'مدیریت'), UpdateStats, deleteLostOrder);

module.exports = router;