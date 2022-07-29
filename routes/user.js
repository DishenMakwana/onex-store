const express = require('express');
const {
  signup,
  login,
  logout,
  forgotPassword,
  passwordReset,
  getLoggedInUserDetails,
  changePassword,
  updateUserDetails,
  adminAllUsers,
  managerAllUsers,
  adminGetOneUser,
  adminUpdateUserDetails,
  adminDeleteOneUser,
} = require('../controllers/userController');
const { isLoggedIn, customRole } = require('../middlewares/user');

const router = express.Router();

// user
router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgotPassword').post(forgotPassword);
router.route('/password/reset/:token').post(passwordReset);
router.route('/userdashboard').get(isLoggedIn, getLoggedInUserDetails);
router.route('/password/update').post(isLoggedIn, changePassword);
router.route('/userdashboard/update').post(isLoggedIn, updateUserDetails);

//admin only routes
router
  .route('/admin/users')
  .get(isLoggedIn, customRole('admin'), adminAllUsers);
router
  .route('/admin/user/:id')
  .get(isLoggedIn, customRole('admin'), adminGetOneUser);
router
  .route('/admin/user/:id')
  .put(isLoggedIn, customRole('admin'), adminUpdateUserDetails);
router
  .route('/admin/user/:id')
  .delete(isLoggedIn, customRole('admin'), adminDeleteOneUser);

// manager only route
router
  .route('/manager/users')
  .get(isLoggedIn, customRole('manager'), managerAllUsers);

module.exports = router;
