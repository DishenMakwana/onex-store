const express = require('express');
const {
  testProduct,
  addProduct,
  getAllProduct,
  adminGetAllProduct,
  getOneProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
  deleteReview,
  getOnlyReviewsForOneProduct,
  addReview,
} = require('../controllers/productController');
const { isLoggedIn, customRole } = require('../middlewares/user');

const router = express.Router();

// user
router.route('/testProduct').get(testProduct);
router.route('/products').get(getAllProduct);
router.route('/product/:id').get(getOneProduct);
router.route('/review').put(isLoggedIn, addReview);
router.route('/review').delete(isLoggedIn, deleteReview);
router.route('/reviews').get(isLoggedIn, getOnlyReviewsForOneProduct);

//admin routes
router
  .route('/admin/product/add')
  .post(isLoggedIn, customRole('admin'), addProduct);
router
  .route('/admin/products')
  .get(isLoggedIn, customRole('admin'), adminGetAllProduct);
router
  .route('/admin/product/:id')
  .put(isLoggedIn, customRole('admin'), adminUpdateOneProduct);
router
  .route('/admin/product/:id')
  .delete(isLoggedIn, customRole('admin'), adminDeleteOneProduct);

module.exports = router;
