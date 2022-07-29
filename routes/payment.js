const express = require('express');
const {
  sendStripeKey,
  sendRazorpayKey,
  captureStripePayment,
  captureRazorpayPayment,
} = require('../controllers/paymentController');
const { isLoggedIn, customRole } = require('../middlewares/user');

const router = express.Router();

router.route('/stripekey').get(isLoggedIn, sendStripeKey);
router.route('/razorpaykey').get(isLoggedIn, sendRazorpayKey);

router.route('/capturestripe').get(isLoggedIn, captureStripePayment);
router.route('/capturerazorpay').get(isLoggedIn, captureRazorpayPayment);

module.exports = router;
