const express = require('express');
const router = express.Router();

const authMiddleware = require('../../../core/middlewares/authMiddleware');
const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');

const { getSetting } = require('../controllers/settingcontrollers/getsetting');
const { updateSetting } = require('../controllers/settingcontrollers/updatesetting');

const settingmiddlewares = [
    authMiddleware,
    dealerAccessMiddleware,
    roleMiddleware('مدیریت', 'انباردار'),
    UpdateStats];

router.get('/get-setting', settingmiddlewares, getSetting);

router.post('/update-setting', settingmiddlewares, updateSetting);

module.exports = router;