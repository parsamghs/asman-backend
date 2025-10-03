const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {getAllCars} = require('../../controllers/orderscontrollers/getcars');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('پذیرش', 'انباردار', 'حسابدار','مدیریت'), UpdateStats, getAllCars);


module.exports = router;