const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {addUser} = require('../../controllers/admincontrollers/adduser');


router.post('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت'), UpdateStats, addUser);


module.exports = router;