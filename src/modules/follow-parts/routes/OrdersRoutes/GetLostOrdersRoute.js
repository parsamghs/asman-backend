const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {getLostOrders} = require('../../controllers/orderscontrollers/getlostorders');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار', 'مدیریت'), UpdateStats, getLostOrders);


module.exports = router;