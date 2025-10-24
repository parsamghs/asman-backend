const express = require('express');
const router = express.Router();
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const { login } = require('../controllers/login');
const { getUserDealers } = require('../controllers/getuserdealers');
const { selectDealer } = require('../controllers/selectdealer');


router.post('/login', UpdateStats, login);

router.get('/get-user-dealers', UpdateStats, getUserDealers);

router.post('/select-dealer', UpdateStats, selectDealer);


module.exports = router;

