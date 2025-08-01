const express = require('express');
const router = express.Router();

router.use('/login', require('./AuthRoutes/LoginRoute'));

module.exports = router;