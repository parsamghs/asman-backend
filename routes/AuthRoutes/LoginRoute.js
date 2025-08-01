const express = require('express');
const router = express.Router();
const dealerAccessMiddleware = require('../../middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../middlewares/updatestatsMiddleware');
const { login } = require('../../controllers/authcontrollers/login');


router.post('/', UpdateStats, login);


module.exports = router;

