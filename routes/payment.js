const express = require("express");
const router = express.Router();
const razorpayService = require("../services/razorpay.js");

// Create Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    const order = await razorpayService.createOrder(amount, currency, receipt);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Order creation failed" });
  }
});

// Verify Razorpay payment
router.post("/verify", (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const isValid = razorpayService.verifyPayment(order_id, payment_id, signature);
  if (isValid) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: "Invalid signature" });
  }
});

module.exports = router;
