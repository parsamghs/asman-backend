const express = require('express');
const router = express.Router();

router.use('/add', require('./OrdersRoutes/AddOrderRoute'));

router.use('/add-pieces-to-reception', require('./OrdersRoutes/AddPieceToReceptionRoute.js'));

router.use('/add-pieces-to-customer', require('./OrdersRoutes/AddPieceToCustomerRoute'));

router.use('/deletecustomer', require('./OrdersRoutes/DeleteCustomerAndAllOrdersRoutes'));

router.use('/deleteorder', require('./OrdersRoutes/DeleteOrderPieceRoute'));

router.use('/all', require('./OrdersRoutes/GetAllOrdersRoute'));

router.use('/orders-count', require('./OrdersRoutes/OrdersCountRoute'));

router.use('/search-orders',require('./OrdersRoutes/OrdersSearchRoute'));

router.use('/search-lost-orders', require('./OrdersRoutes/SearchLostOrdersRoute'));

router.use('/suggest-parts', require('./OrdersRoutes/PartsAutoCompleteRoute'));

router.use('/partname-suggest', require('./OrdersRoutes/PartNameAutoCompleteRoute'));

router.use('/edit', require('./OrdersRoutes/UpdateOrderRoute'));

router.use('/get-cars', require('./OrdersRoutes/GetCarsRoute'));

router.use('/bulkedit', require('./OrdersRoutes/BulkUpdateOrdersRoute'));

router.use('/getcars', require('./OrdersRoutes/GetAllCarsRoute'));

router.use('/getlostorders', require('./OrdersRoutes/GetLostOrdersRoute.js'));

router.use('/addlostorder', require('./OrdersRoutes/AddLostOrderRoute'));

router.use('/update-lost-order', require('./OrdersRoutes/UpdateLostOrderRoute'));

router.use('/delete-lost-order', require('./OrdersRoutes/DeleteLostOrderRoute'));


module.exports = router;
