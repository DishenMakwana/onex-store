const express = require('express');
const {
  testProduct,
  addProduct,
  getAllProduct,
} = require('../controllers/productController');
const { isLoggedIn, customRole } = require('../middlewares/user');

const router = express.Router();

// user
router.route('/testProduct').get(testProduct);
router.route('/products').get(getAllProduct);

// admin
router
  .route('/admin/product/add')
  .post(isLoggedIn, customRole('admin'), addProduct);

module.exports = router;
