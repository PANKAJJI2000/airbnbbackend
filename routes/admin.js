const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

// Only require Review and Booking if they exist
let Review, Booking;
try {
  Review = require("../models/review.js");
} catch (e) {
  console.log("Review model not found");
}
try {
  Booking = require("../models/booking.js");
} catch (e) {
  console.log("Booking model not found");
}

// Get all listings (JSON)
router.get("/listings", async (req, res) => {
  try {
    const listings = await Listing.find({}).populate("owner");
    res.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: error.message, message: "Failed to fetch listings" });
  }
});

// Get all users (JSON)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password -salt");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message, message: "Failed to fetch users" });
  }
});

// Get all reviews (JSON) - Alternative version
router.get("/reviews", async (req, res) => {
  try {
    if (!Review) {
      console.log("Review model not found, returning empty array");
      return res.json([]);
    }
    
    // First get one review to check schema
    const sampleReview = await Review.findOne().lean();
    
    let query = Review.find({});
    
    // Only populate fields that exist in schema
    if (sampleReview && sampleReview.hasOwnProperty('author')) {
      query = query.populate({
        path: "author",
        select: "username email"
      });
    }
    
    if (sampleReview && sampleReview.hasOwnProperty('listing')) {
      query = query.populate({
        path: "listing",
        select: "title"
      });
    }
    
    const reviews = await query.lean();
    
    // console.log(`Found ${reviews.length} reviews`);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.json([]);
  }
});

// Get all bookings (JSON)
router.get("/bookings", async (req, res) => {
  try {
    if (!Booking) {
      console.log("Booking model not found, returning empty array");
      return res.json([]);
    }
    
    const bookings = await Booking.find({})
      .populate({
        path: "user",
        select: "username email"
      })
      .populate({
        path: "listing",
        select: "title"
      })
      .lean();
    
    // console.log(`Found ${bookings.length} bookings`);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: error.message, message: "Failed to fetch bookings" });
  }
});

// Delete listing
router.delete("/listings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.json({ success: true, message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
router.delete("/reviews/:id", async (req, res) => {
  try {
    if (!Review) {
      return res.status(404).json({ error: "Review model not available" });
    }
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete booking
router.delete("/bookings/:id", async (req, res) => {
  try {
    if (!Booking) {
      return res.status(404).json({ error: "Booking model not available" });
    }
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status
router.patch("/bookings/:id", async (req, res) => {
  try {
    if (!Booking) {
      return res.status(404).json({ error: "Booking model not available" });
    }
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("user", "username email")
      .populate("listing", "title");
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
