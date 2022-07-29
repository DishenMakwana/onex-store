const Order = require('../models/order');
const Product = require('../models/product');
const BigPromise = require('../middlewares/bigPromise');

exports.createOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItem,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const order = Order.create({
    shippingInfo,
    orderItem,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 401)
    );
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getLoggedInOrders = BigPromise(async (req, res, next) => {
  const order = Order.find({ user: req.user._id });

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 401)
    );
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminGetAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find();

  res.status(200).json({
    success: true,
    orders,
  });
});

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order.orderStatus === 'delivered') {
    return next(
      new ErrorResponse(
        `Order already delivered with id of ${req.params.id}`,
        401
      )
    );
  }

  order.orderStatus = req.body.orderStatus;

  order.orderItems.forEach(async (prod) => {
    await updateProductStock(prod.product, prod.quantity);
  });

  await order.save();

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 401)
    );
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});

const updateProductStock = async (productId, quantity) => {
  const product = await Product.findById(productId);

  product.stock -= quantity;

  await product.save({ validateBeforeSave: false });
};
