const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const {getDealersStats} = require('../../controllers/systemcontollers/getdealersstats');


router.get('/', authMiddleware, roleMiddleware('ادمین'), getDealersStats);


module.exports = router;
