const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {addPart} = require('../../controllers/admincontrollers/addpart');


router.post('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت'), UpdateStats, addPart);


module.exports = router;

