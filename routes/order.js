const express = require('express');
const {
  createOrder,
  getOneOrder,
  getLoggedInOrders,
  adminUpdateOrder,
  adminDeleteOrder,
  adminGetAllOrders,
} = require('../controllers/orderController');
const { isLoggedIn, customRole } = require('../middlewares/user');

const router = express.Router();

router.route('/order/create').post(isLoggedIn, createOrder);
router.route('/order/:id').get(isLoggedIn, getOneOrder);
router.route('/myorder').get(isLoggedIn, getLoggedInOrders);

//admin routes
router
  .route('/admin/orders')
  .get(isLoggedIn, customRole('admin'), adminGetAllOrders);
router
  .route('/admin/order/:id')
  .put(isLoggedIn, customRole('admin'), adminUpdateOrder);
router
  .route('/admin/order/:id')
  .delete(isLoggedIn, customRole('admin'), adminDeleteOrder);

module.exports = router;
