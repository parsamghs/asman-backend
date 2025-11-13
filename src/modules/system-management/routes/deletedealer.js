const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const {deleteDealer} = require('../contollers/deletedealer');


router.delete('/:dealer_id', authMiddleware, roleMiddleware('ادمین'), deleteDealer);


module.exports = router;