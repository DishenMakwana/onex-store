const express = require('express');
const {
  sendStripeKey,
  sendRazorpayKey,
  captureStripePayment,
  captureRazorpayPayment,
} = require('../controllers/paymentController');
const { isLoggedIn } = require('../middlewares/user');

const router = express.Router();

router.route('/stripekey').get(isLoggedIn, sendStripeKey);
router.route('/razorpaykey').get(isLoggedIn, sendRazorpayKey);

router.route('/capturestripe').post(isLoggedIn, captureStripePayment);
router.route('/capturerazorpay').post(isLoggedIn, captureRazorpayPayment);

module.exports = router;
