const express = require('express');
const router = express.Router();

router.use('/add-dealer', require('./SystemRoutes/AddDealerRoute'));

router.use('/get-dealers', require('./SystemRoutes/GetDealersRoute'));

module.exports = router;