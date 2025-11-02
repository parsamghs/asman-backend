const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const {getDealerModules} = require('../controllers/getmodules');


router.get('/', authMiddleware, UpdateStats, getDealerModules);


module.exports = router;
