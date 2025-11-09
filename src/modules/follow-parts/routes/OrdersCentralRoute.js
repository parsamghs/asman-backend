const express = require('express');
const router = express.Router();

const authMiddleware = require('../../../core/middlewares/authMiddleware');
const roleMiddleware = require('../../../core/middlewares/roleMiddleware');
const dealerAccessMiddleware = require('../../../core/middlewares/dealerAccessMiddleware');
const UpdateStats = require('../../../core/middlewares/updatestatsMiddleware');

const { addLostOrder } = require('../controllers/orderscontrollers/addlostordercontrollers');
const { addOrder } = require('../controllers/orderscontrollers/addOrder');
const { addPiecesToCustomer } = require('../controllers/orderscontrollers/addPiecesToCustomer');
const { addPiecesToExistingReception } = require('../controllers/orderscontrollers/addpiecetoreception');
const { updateMultipleOrderStatus } = require('../controllers/orderscontrollers/bulkupdateorders');
const { deleteCustomerAndAllOrders } = require('../controllers/orderscontrollers/deleteCustomerAndAllOrders');
const { deleteLostOrder } = require('../controllers/orderscontrollers/deletelostorder');
const { deleteOrderPiece } = require('../controllers/orderscontrollers/deleteOrderPiece');
const { getAllOrders } = require('../controllers/orderscontrollers/getAllOrders');
const { getAllCars } = require('../controllers/orderscontrollers/getcars');
const { getLostOrders } = require('../controllers/orderscontrollers/getlostorders');
const { getOrderscounts } = require('../controllers/orderscontrollers/orderscount');
const { searchOrders } = require('../controllers/orderscontrollers/searchorders');
const { suggestPartsByName } = require('../controllers/orderscontrollers/partnameautocomplete');
const { suggestParts } = require('../controllers/orderscontrollers/partsautocomplete');
const { searchLostOrders } = require('../controllers/orderscontrollers/searchlostorders');
const { updateOrder } = require('../controllers/orderscontrollers/UpdateCustomer');
const { updateLostOrder } = require('../controllers/orderscontrollers/updatelostorder');
const { updatestatus } = require('../controllers/orderscontrollers/updatestatus');

const authAdminOrWarehouse = [authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت'), UpdateStats];
const authAllOrdersRoles = [authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت','پذیرش','حسابدار'), UpdateStats];
const authUpdateOrderRoles = [authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار', 'حسابدار','پذیرش','مدیریت'), UpdateStats];
const authUpdateMultipleStatusRoles = [authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت','پذیرش','حسابدار'), UpdateStats];
const authLostOrdersRoles = [authMiddleware, dealerAccessMiddleware, roleMiddleware('انباردار','مدیریت'), UpdateStats];

router.post('/addlostorder', authAdminOrWarehouse, addLostOrder);
router.post('/add', authAdminOrWarehouse, addOrder);
router.post('/add-pieces-to-customer/:customer_id', authAdminOrWarehouse, addPiecesToCustomer);
router.post('/add-pieces-to-reception/:reception_id', authAdminOrWarehouse, addPiecesToExistingReception);

router.patch('/bulkedit', authUpdateMultipleStatusRoles, updateMultipleOrderStatus);
router.patch('/edit-customer/:customerId', authUpdateOrderRoles, updateOrder);
router.patch('/update-lost-order/:id', authLostOrdersRoles, updateLostOrder);
router.patch('/edit/:orderId', authUpdateOrderRoles, updatestatus);

router.delete('/deletecustomer/:customerId', authAdminOrWarehouse, deleteCustomerAndAllOrders);
router.delete('/delete-lost-order/:id', authAdminOrWarehouse, deleteLostOrder);
router.delete('/deleteorder/:order_id', authAdminOrWarehouse, deleteOrderPiece);

router.get('/all', authAllOrdersRoles, getAllOrders);
router.get('/get-cars', authAllOrdersRoles, getAllCars);
router.get('/getlostorders', authLostOrdersRoles, getLostOrders);
router.get('/orders-count', authUpdateMultipleStatusRoles, getOrderscounts);
router.get('/search-orders', authAllOrdersRoles, searchOrders);
router.get('/partname-suggest/:partname_id', authAdminOrWarehouse, suggestPartsByName);
router.get('/suggest-parts', authAdminOrWarehouse, suggestParts);
router.get('/search-lost-orders', authAdminOrWarehouse, searchLostOrders);

module.exports = router;
