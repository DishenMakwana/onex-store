const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const crypto = require('crypto');
const mailHelper = require('../utils/emailHelper');
const cloudinary = require('cloudinary');

exports.signup = BigPromise(async (req, res, next) => {
  //let result;

  if (!req.files) {
    return next(new CustomError('photo is required for signup', 400));
  }

  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError('Name, email and password are required', 400));
  }

  let file = req.files.photo;

  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: 'users',
    width: 150,
    crop: 'scale',
  });

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  await cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  // check for presence of email and password
  if (!email || !password) {
    return next(new CustomError('Email and password are required', 400));
  }

  // get user from DB
  const user = await User.findOne({ email }).select('+password');

  // if user not found in DB
  if (!user) {
    return next(new CustomError('User not found', 400));
  }

  // match the password
  const isPasswordCorrect = await user.isValidatedPassword(password);

  //if password do not match
  if (!isPasswordCorrect) {
    return next(new CustomError('Password is incorrect', 400));
  }

  // if all goes good and we send the token
  await cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  //clear the cookie
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  //send JSON response for success
  res.status(200).json({
    success: true,
    message: 'Logout success',
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  // collect email
  const { email } = req.body;

  if (!email) {
    return next(new CustomError('Email is required', 400));
  }

  const user = await User.findOne({ email });

  // if user not found in database
  if (!user) {
    return next(new CustomError('User not found', 400));
  }

  //get token from user model methods
  const forgotToken = await user.getForgotPasswordToken();

  // save user fields in DB
  await user.save({ validateBeforeSave: false });

  // create a URL
  const myUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${forgotToken}`;

  // craft a message
  const message = `Copy paste this link in your URL and hit enter \n\n ${myUrl}`;

  // attempt to send email
  try {
    await mailHelper({
      email: user.email,
      subject: 'OneX store - Password reset email',
      message,
    });

    // json reponse if email is success
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    // reset user fields if things goes wrong
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // send error response
    return next(new CustomError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  //get token from params
  const token = req.params.token;

  // hash the token as db also stores the hashed version
  const encryToken = crypto.createHash('sha256').update(token).digest('hex');

  // find user based on hased on token and time in future
  const user = await User.findOne({
    forgotPasswordToken: encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError('Invalid token', 400));
  }

  // check if password and conf password matched
  if (req.body.password !== req.body.confirmPassword) {
    return next(new CustomError('Passwords do not match', 400));
  }

  // update password field in DB
  user.password = req.body.password;

  // reset token fields
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  // save the user
  await user.save({ validateBeforeSave: false });

  // send a JSON response OR send token

  await cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  //req.user will be added by middleware
  // find user by id
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  res.status(200).json({ success: true, user });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  // get user from middleware
  const userId = req.user._id;

  // get user from database
  const user = await User.findById(userId).select('+password');

  //check if old password is correct
  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  if (!isCorrectOldPassword) {
    return next(new CustomError('Password is incorrect', 400));
  }

  // allow to set new password
  user.password = req.body.password;

  await user.save();

  await cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  if (!name || !email) {
    return next(new CustomError('Name and email are required', 400));
  }

  // collect data from body
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  // if photo comes to us
  if (req.files) {
    const user = await User.findById(req.user._id);

    const imageId = user.photo.id;

    // delete photo on cloudinary
    await cloudinary.v2.uploader.destroy(imageId);

    // upload the new photo
    const res = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: 'users',
        width: 150,
        crop: 'scale',
      }
    );

    // add photo data in newData object
    newData.photo = {
      id: res.public_id,
      secure_url: res.secure_url,
    };
  }

  // update the data in user
  const user = await User.findByIdAndUpdate(req.user._id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, user });
});

exports.adminAllUsers = BigPromise(async (req, res, next) => {
  // select all users
  const users = await User.find({});

  // send all users
  res.status(200).json({ success: true, users });
});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {
  // get id from url and get user from database
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  // send user
  res.status(200).json({ success: true, user });
});

exports.adminUpdateUserDetails = BigPromise(async (req, res, next) => {
  // add a check for email and name in body

  // get data from request body
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  // update the user in database
  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, user });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  // get user from url
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  // get image id from user in database
  const imageId = user.photo.id;

  // delete image from cloudinary
  await cloudinary.v2.uploader.destroy(imageId);

  // remove user from database
  await user.remove();

  res.status(200).json({ success: true });
});

exports.managerAllUsers = BigPromise(async (req, res, next) => {
  // select the user with role of user
  const users = await User.find({ role: 'user' });

  res.status(200).json({ success: true, users });
});
