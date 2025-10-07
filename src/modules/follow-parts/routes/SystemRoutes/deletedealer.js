const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const {deleteDealer} = require('../../controllers/systemcontollers/deletedealer');


router.delete('/:dealer_id', authMiddleware, roleMiddleware('ادمین'), deleteDealer);


module.exports = router;