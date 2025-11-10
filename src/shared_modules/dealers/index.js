const express = require('express');
const router = express.Router();

const authMiddleware = require('../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../core/middlewares/roleMiddleware');
const UpdateStats = require('../../core/middlewares/updatestatsMiddleware');

const {getRemainingSubscription} = require('../dealers/controllers/getremainingsubscription');
const {getDealerModules} = require('../dealers/controllers/getmodules');
const {getUserDealers} = require('../dealers/controllers/getuserdealers');
const {selectModule} = require('../dealers/controllers/selectmodule');
const {selectDealer} = require('../dealers/controllers/selectdealer');

const subscriptionmiddlewares = [
    authMiddleware,
    roleMiddleware('مدیریت','پذیرش','انباردار','حسابدار'),
    UpdateStats];

const adminmiddlewares = [
    authMiddleware,
    roleMiddleware('مدیریت'),
    UpdateStats];

router.get('/subscription', subscriptionmiddlewares, getRemainingSubscription);
router.get('/modules', authMiddleware, UpdateStats, getDealerModules);
router.get('/user-dealers', adminmiddlewares, getUserDealers);

router.post('/select-module', adminmiddlewares, selectModule);
router.post('/select-dealer', adminmiddlewares, selectDealer);

module.exports = router;