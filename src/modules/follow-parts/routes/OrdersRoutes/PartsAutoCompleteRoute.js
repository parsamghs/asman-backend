const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../../core/middlewares/updatestatsMiddleware');
const {suggestParts} = require('../../controllers/orderscontrollers/partsautocomplete');


router.get('/', authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت'), UpdateStats, suggestParts);


module.exports = router;