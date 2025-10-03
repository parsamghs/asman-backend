const express = require('express');
const router = express.Router();

router.use('/addpart', require('./AdminRoutes/AddPartRoute'));

router.use('/adduser', require('./AdminRoutes/AddUserRoute'));

router.use('/deleteuser', require('./AdminRoutes/DeleteUserRoute'));

router.use('/updateuser', require('./AdminRoutes/UpdateUserRoute'));

router.use('/usersstats', require('./AdminRoutes/GetUsersWithStatsRoute'));

router.use('/getlogs', require('./AdminRoutes/GetLogsRoute'));

module.exports = router;