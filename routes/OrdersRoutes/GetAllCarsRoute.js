const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {getAllCars} = require('../../controllers/orderscontrollers/getallcars');


router.get('/', authMiddleware, roleMiddleware('انباردار','مدیریت'), UpdateStats, getAllCars);


module.exports = router;