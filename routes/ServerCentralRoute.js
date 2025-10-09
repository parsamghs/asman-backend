const express = require('express');
const router = express.Router();

router.use('/stats', require('./ServerRoutes/getserverlogsRoute'));


module.exports = router;