const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    maxlength: [50, 'Name must be less than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    validator: [validator.isEmail, 'Please provide a valid email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    // minlength: [8, 'Password must be at least 8 characters'],
    // maxlength: [50, 'Password must be less than 50 characters'],
    select: false,
  },
  role: {
    type: String,
    default: 'user',
  },
  photo: {
    id: {
      type: String,
      required: [true, 'Please provide your photo id'],
    },
    secure_url: {
      type: String,
      required: [true, 'Please provide your photo url'],
    },
  },
  forgotPasswordToken: {
    type: String,
  },
  forgotPasswordExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//encrypt password before save - HOOKS
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// validate the password with passed on user password
userSchema.methods.isValidatedPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//create and return jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

//generate forgot password token (string)
userSchema.methods.getForgotPasswordToken = function () {
  // generate a long and randomg string
  const forgotToken = crypto.randomBytes(20).toString('hex');

  // getting a hash - make sure to get a hash on backend
  this.forgotPasswordToken = crypto
    .createHash('sha256')
    .update(forgotToken)
    .digest('hex');

  //time of token
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

  return forgotToken;
};

module.exports = mongoose.model('User', userSchema);
