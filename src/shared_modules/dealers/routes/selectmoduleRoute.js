const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');
const {selectModule} = require('../controllers/selectmodule');


router.post('/', authMiddleware, UpdateStats, selectModule);


module.exports = router;
