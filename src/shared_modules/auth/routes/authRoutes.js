const express = require('express');
const router = express.Router();
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const { login } = require('../controllers/login');


router.post('/login', UpdateStats, login);


module.exports = router;

