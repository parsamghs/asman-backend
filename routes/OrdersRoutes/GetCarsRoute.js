const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {getAllCars} = require('../../controllers/orderscontrollers/getcars');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('پذیرش', 'انباردار', 'حسابدار','مدیریت'), UpdateStats, getAllCars);


module.exports = router;