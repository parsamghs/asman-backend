const express = require('express');
const router = express.Router();

router.use('/dealers', require('./dealers/index'));

router.use('/utcdate', require('./utc/route/GetUtcDate'));

module.exports = router;
