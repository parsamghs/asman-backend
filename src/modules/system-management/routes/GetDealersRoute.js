const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const {getDealersStats} = require('../contollers/getdealersstats');


router.get('/', authMiddleware, roleMiddleware('ادمین'), getDealersStats);


module.exports = router;
