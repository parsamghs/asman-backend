const express = require('express');
const router = express.Router();

router.use('/add-dealer', require('./routes/AddDealerRoute'));

router.use('/get-dealers', require('./routes/GetDealersRoute'));

router.use('/delete-dealer', require('./routes/deletedealer'));

module.exports = router;