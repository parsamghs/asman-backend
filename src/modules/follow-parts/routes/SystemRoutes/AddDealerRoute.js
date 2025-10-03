const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../../core/middlewares/roleMiddleware');
const {addDealerAndUser} = require('../../controllers/systemcontollers/adddealer');


router.post('/', authMiddleware, roleMiddleware('ادمین'), addDealerAndUser);


module.exports = router;