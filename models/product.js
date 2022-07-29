const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name cannot be more than 120 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    maxlength: [6, 'Product price cannot be more than 6 digits'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  photos: [
    {
      id: {
        type: String,
        required: [true, 'Product photo id is required'],
      },
      secure_url: {
        type: String,
        required: [true, 'Product photo secure url is required'],
      },
    },
  ],
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['shortsleeves', 'longsleeves', 'sweatshirt', 'hoodies'],
      message: 'Please select a valid category',
    },
  },
  brand: {
    type: String,
    required: [true, 'Product brand is required'],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Product review user is required'],
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);
