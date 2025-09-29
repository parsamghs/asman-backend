const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {updateOrder} = require('../../controllers/orderscontrollers/UpdateCustomer');


router.patch('/:customerId', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار', 'حسابدار','پذیرش','مدیریت'), UpdateStats, updateOrder);


module.exports = router;

