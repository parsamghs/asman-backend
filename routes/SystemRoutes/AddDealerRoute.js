const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const {addDealerAndUser} = require('../../controllers/systemcontollers/adddealer');


router.post('/', authMiddleware, roleMiddleware('ادمین'), addDealerAndUser);


module.exports = router;