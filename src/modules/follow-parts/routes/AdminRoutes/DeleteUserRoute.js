const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {deleteUser} = require('../../controllers/admincontrollers/deleteuser');

router.delete('/:id', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت'), UpdateStats, deleteUser);

module.exports = router;
