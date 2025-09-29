const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {addPart} = require('../../controllers/admincontrollers/addpart');


router.post('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت'), UpdateStats, addPart);


module.exports = router;

