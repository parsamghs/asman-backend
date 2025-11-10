const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../core/middlewares/authMiddleware');
const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');

const { getLogs } = require('../controllers/admincontrollers/getlogs');
const { getUsersWithStatus } = require('../controllers/admincontrollers/getuserswithstats');
const { addPart } = require('../controllers/admincontrollers/addpart');
const { addUser } = require('../controllers/admincontrollers/adduser');
const { updateUser } = require('../controllers/admincontrollers/updateuser');
const { deleteUser } = require('../controllers/admincontrollers/deleteuser');

const adminmiddlewares = [
    authMiddleware,
    dealerAccessMiddleware, 
    roleMiddleware('مدیریت'), 
    UpdateStats];

router.get('/getlogs', adminmiddlewares, getLogs);
router.get('/usersstats', adminmiddlewares, getUsersWithStatus);

router.post('/addpart', adminmiddlewares, addPart);
router.post('/adduser', adminmiddlewares, addUser);

router.delete('/deleteuser/:id', adminmiddlewares, deleteUser);

router.patch('/updateuser/:id', adminmiddlewares, updateUser);

module.exports = router;
