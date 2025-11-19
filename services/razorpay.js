const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (amount, currency = "INR", receipt = "receipt#1") => {
  const options = {
    amount: amount * 100, // amount in paise
    currency,
    receipt,
  };
  return await razorpay.orders.create(options);
};

exports.verifyPayment = (order_id, payment_id, signature) => {
  const body = order_id + "|" + payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};
