const express = require('express');
const router = express.Router();

const authMiddleware = require('../../core\/middlewares/authMiddleware');
const dealerAccessMiddleware= require('../../core/middlewares/dealerAccessMiddleware');
const roleMiddleware = require('../../core/middlewares/roleMiddleware');
const UpdateStats = require('../../core/middlewares/updatestatsMiddleware');

const {getRemainingSubscription} = require('../controllers/getremainingsubscription');
const {getDealerModules} = require('../controllers/getmodules');
const {getUserDealers} = require('../controllers/getuserdealers');
const {selectModule} = require('../controllers/selectmodule');
const {selectDealer} = require('../controllers/selectdealer');

const subscriptionmiddlewares = [
    authMiddleware,
    dealerAccessMiddleware,
    roleMiddleware('مدیریت','پذیرش','انباردار','حسابدار'),
    UpdateStats];

const adminmiddlewares = [
    authMiddleware,
    dealerAccessMiddleware,
    roleMiddleware('مدیریت'),
    UpdateStats];

router.get('/subscription', subscriptionmiddlewares, getRemainingSubscription);
router.get('/modules', authMiddleware, UpdateStats, getDealerModules);
router.get('/user-dealers', adminmiddlewares, getUserDealers);

router.post('/select-module', adminmiddlewares, selectModule);
router.post('/select-dealer', adminmiddlewares, selectDealer);

module.exports = router;