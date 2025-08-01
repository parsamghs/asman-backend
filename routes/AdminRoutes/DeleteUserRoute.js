const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const {deleteUser} = require('../../controllers/admincontrollers/deleteuser');

router.delete('/:id', authMiddleware, dealerAccessMiddleware, roleMiddleware('مدیریت'), UpdateStats, deleteUser);

module.exports = router;
