const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {updateUser} = require('../../controllers/admincontrollers/updateuser');


router.patch('/:id', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت','پذیرش','انبادار','حسابدار'), UpdateStats, updateUser);


module.exports = router;
