const express = require("express");
const router = express.Router();
const Booking = require("../models/booking.js");
const { isLoggedIn } = require("../middleware.js");
const mongoose = require("mongoose");

// Middleware to validate ObjectId and filter out static file requests
const validateBookingId = (req, res, next) => {
  const { id } = req.params;

  // Ignore favicon and other static files
  if (id === "favicon.ico" || id.includes(".")) {
    return res.status(404).send("Not found");
  }

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Invalid booking ID");
    return res.redirect("/bookings");
  }

  next();
};

// Show all user's bookings
router.get(
  "/",
  isLoggedIn,
  async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });
      res.render("bookings/index", { bookings });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      req.flash("error", "Unable to fetch bookings");
      res.redirect("/listings");
    }
  }
);

// Show single booking details
router.get(
  "/:id",
  isLoggedIn,
  validateBookingId,
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate("listing")
        .populate("user");

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
      }

      if (!booking.user._id.equals(req.user._id)) {
        req.flash("error", "You do not have permission to view this booking");
        return res.redirect("/bookings");
      }

      res.render("bookings/show", { booking });
    } catch (err) {
      console.error("Error fetching booking:", err);
      req.flash("error", "Unable to fetch booking details");
      res.redirect("/bookings");
    }
  }
);

// Cancel booking (PATCH method)
router.patch(
  "/:id/cancel",
  isLoggedIn,
  validateBookingId,
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
      }

      if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You do not have permission to cancel this booking");
        return res.redirect("/bookings");
      }

      booking.status = "cancelled";
      booking.paymentStatus = "refunded";
      await booking.save();

      req.flash("success", "Booking cancelled successfully");
      res.redirect("/bookings");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      req.flash("error", "Failed to cancel booking");
      res.redirect("/bookings");
    }
  }
);

// Update payment method
router.put(
  "/:id/payment",
  isLoggedIn,
  validateBookingId,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;

      const booking = await Booking.findById(id);

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
      }

      if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You do not have permission to update this booking");
        return res.redirect("/bookings");
      }

      booking.paymentMethod = paymentMethod;
      await booking.save();

      req.flash("success", "Payment method updated successfully!");
      res.redirect("/bookings");
    } catch (err) {
      console.error("Error updating payment:", err);
      req.flash("error", "Failed to update payment method");
      res.redirect("/bookings");
    }
  }
);

// Delete booking
router.delete(
  "/:id",
  isLoggedIn,
  validateBookingId,
  async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
      }

      if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You do not have permission to cancel this booking");
        return res.redirect("/bookings");
      }

      await Booking.findByIdAndDelete(id);
      req.flash("success", "Booking cancelled successfully");
      res.redirect("/bookings");
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to cancel booking");
      res.redirect("/bookings");
    }
  }
);

module.exports = router;