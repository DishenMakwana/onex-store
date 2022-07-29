const Product = require('../models/product');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const WhereClause = require('../utils/whereClause');
const cloudinary = require('cloudinary').v2;

exports.testProduct = BigPromise(async (req, res) => {
  res.status(200).json({
    success: true,
    greeting: 'this is another dummy route',
  });
});

exports.addProduct = BigPromise(async (req, res, next) => {
  let imageArray = [];

  if (!req.files) {
    return next(new CustomError('image is required', 401));
  }

  if (req.files) {
    for (let idx = 0; idx < req.files.length; idx++) {
      let result = await cloudinary.uploader.upload(
        req.files.photos[idx].tempFilePath,
        {
          folder: 'products',
        }
      );

      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imageArray;
  req.body.user = req.user._id;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProduct = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;
  const totalCountProduct = await Product.countDocuments();

  const productsObj = new WhereClause(await Product.find({}), req.query)
    .search()
    .filter();

  let products = await productsObj.base;
  const filteredProductNumber = products.length;

  productsObj.pager(resultPerPage);
  products = await productsObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    filteredProductNumber,
    totalCountProduct,
  });
});
