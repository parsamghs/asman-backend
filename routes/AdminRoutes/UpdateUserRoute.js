const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {updateUser} = require('../../controllers/admincontrollers/updateuser');


router.patch('/:id', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت','پذیرش','انبادار','حسابدار'), UpdateStats, updateUser);


module.exports = router;
