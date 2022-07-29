const express = require('express');
const {
  createOrder,
  getOneOrder,
  getLoggedInOrders,
  adminUpdateOrder,
  adminDeleteOrder,
} = require('../controllers/orderController');
const { isLoggedIn, customRole } = require('../middlewares/user');

const router = express.Router();

router.route('/order/create').post(isLoggedIn, createOrder);
router.route('/order/:id').post(isLoggedIn, getOneOrder);
router.route('/myorder').post(isLoggedIn, getLoggedInOrders);

router
  .route('/admin/orders')
  .post(isLoggedIn, customRole('admin'), getLoggedInOrders);
router
  .route('/admin/order/:id')
  .put(isLoggedIn, customRole('admin'), adminUpdateOrder);
router
  .route('/admin/order/:id')
  .delete(isLoggedIn, customRole('admin'), adminDeleteOrder);

module.exports = router;
