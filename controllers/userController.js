const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const crypto = require('crypto');
const mailHelper = require('../utils/emailHelper');
const cloudinary = require('cloudinary').v2;

exports.signup = BigPromise(async (req, res, next) => {
  if (!req.files) {
    return next(new CustomError('photo is required for signup', 400));
  }

  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError('Name, email and password are required', 400));
  }

  let file = req.files.photo;

  const result = await cloudinary.uploader.upload(file.tempFilePath, {
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

  if (!email || !password) {
    return next(new CustomError('Email and password are required', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  const isPasswordCorrect = await user.isValidatedPassword(password);

  if (!isPasswordCorrect) {
    return next(new CustomError('Password is incorrect', 401));
  }

  await cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({ message: 'Logout successful' });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new CustomError('Email is required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  const forgotToken = await user.getForgotPasswordToken();

  await user.save({ validateBeforeSave: false });

  const myUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${forgotToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password for your account. Please make a POST request to: ${myUrl}`;

  try {
    await mailHelper({
      email: user.email,
      subject: 'OneX store - Reset your password',
      message,
    });

    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new CustomError(err.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  const { token } = req.params;

  const encryToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    forgotPasswordToken: encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError('Invalid token', 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new CustomError('Passwords do not match', 400));
  }

  user.password = req.body.password;

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  await user.save({ validateBeforeSave: false });

  await cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  res.status(200).json({ success: true, user });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('+password');

  const isCorrectPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  if (!isCorrectPassword) {
    return next(new CustomError('Password is incorrect', 400));
  }

  user.password = req.body.password;

  await user.save();

  await cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  if (!name || !email) {
    return next(new CustomError('Name and email are required', 400));
  }

  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.files) {
    const user = await User.findById(req.user._id);

    const imageId = user.photo.id;

    await cloudinary.uploader.destroy(imageId);

    const res = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
      folder: 'users',
      width: 150,
      crop: 'scale',
    });

    newData.photo = {
      id: res.public_id,
      secure_url: res.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, user });
});

exports.adminAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({ success: true, users });
});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  res.status(200).json({ success: true, user });
});

exports.adminUpdateUserDetails = BigPromise(async (req, res, next) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, user });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  const imageId = user.photo.id;

  await cloudinary.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({ success: true });
});

exports.managerAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: 'user' });

  res.status(200).json({ success: true, users });
});
