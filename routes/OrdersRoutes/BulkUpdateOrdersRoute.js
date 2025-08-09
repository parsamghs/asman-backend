const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {updateMultipleOrderStatus} = require('../../controllers/orderscontrollers/bulkupdateorders');


router.patch('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت','پذیرش','حسابدار'), UpdateStats, updateMultipleOrderStatus);


module.exports = router;