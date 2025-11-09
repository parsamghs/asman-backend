const express = require('express');
const router = express.Router();

const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');

const { updateSetting } = require('../controllers/settingcontrollers/updatesetting');
const { getSetting } = require('../controllers/settingcontrollers/getsetting');

const settingmiddlewares = [
    authMiddleware,
    dealerAccessMiddleware,
    roleMiddleware('مدیریت', 'انباردار'),
    UpdateStats];

router.get('/get-setting', settingmiddlewares, getSetting);
router.post('/update-setting', settingmiddlewares, updateSetting);

module.exports = router;