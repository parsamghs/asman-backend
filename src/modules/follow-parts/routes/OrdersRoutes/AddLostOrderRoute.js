const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {addLostOrder} = require('../../controllers/orderscontrollers/addlostordercontrollers');


router.post('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار', 'مدیریت'), UpdateStats, addLostOrder);


module.exports = router;