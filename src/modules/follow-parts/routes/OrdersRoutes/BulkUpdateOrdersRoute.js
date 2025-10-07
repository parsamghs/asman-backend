const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {updateMultipleOrderStatus} = require('../../controllers/orderscontrollers/bulkupdateorders');


router.patch('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت','پذیرش','حسابدار'), UpdateStats, updateMultipleOrderStatus);


module.exports = router;