const OrderSchema = require("../models/Order");
const ProductSchema = require("../models/Product");

const { StatusCodes } = require("http-status-codes");
const {
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
} = require("../utils");

const {
  BadRequestError,
  UnauthenticatedError,
  CustomAPIError,
  NotFoundError,
} = require("../errors");

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = "somevalue";
  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;
  if (!cartItems || cartItems.length < 1) {
    throw new BadRequestError(`No cart items provided`);
  }
  if (!tax || !shippingFee) {
    throw new BadRequestError(`Please provide shipping and tax fee`);
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await ProductSchema.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new NotFoundError(`No product with id: ${item.product} `);
    }

    const { name, price, image, _id } = dbProduct;
    console.log(name, price, image, _id);

    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };

    // them item vao order
    orderItems = [...orderItems, singleOrderItem];
    // calculate subtotal total
    subtotal += item.amount * price;
  }

  // calculate total
  const total = tax + shippingFee + subtotal;
  // get client secret

  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: "usd",
  });

  const order = await OrderSchema.create({
    tax,
    total,
    orderItems,
    subtotal,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
  });

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
  const orders = await OrderSchema.find({});
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await OrderSchema.find({ _id: orderId });
  if (!order) {
    throw new NotFoundError(`No product with id: ${orderId} `);
  }
  checkPermissions(req.user, order.user);
  res.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrders = async (req, res) => {
  const orders = await OrderSchema.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntent } = req.body;

  const order = await OrderSchema.findOne({ _id: orderId });
  if (!order) {
    throw new NotFoundError(`No product with id: ${orderId} `);
  }
  checkPermissions(req.user, order.user);
  order.paymentIntent = paymentIntent;
  order.status = "paid";
  await OrderSchema.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
