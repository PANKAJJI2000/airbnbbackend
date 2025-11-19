const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

// Show all bookings for a user
module.exports.index = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });
    res.render("bookings/index.ejs", { bookings });
  } catch (error) {
    req.flash("error", "Error fetching bookings");
    res.redirect("/listings");
  }
};

// Show booking form
module.exports.renderBookingForm = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    res.render("bookings/new.ejs", { listing });
  } catch (error) {
    req.flash("error", "Error loading booking form");
    res.redirect("/listings");
  }
};

// Create new booking
module.exports.createBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, guests, phoneNumber, specialRequests } = req.body;

    console.log("Raw form data:", req.body);
    console.log("Booking data received:", { checkIn, checkOut, guests, phoneNumber, specialRequests });

    // Double check required fields
    if (!phoneNumber || phoneNumber.trim() === '') {
      req.flash("error", "Phone number is required for booking");
      return res.redirect(`/listings/${id}/book`);
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      req.flash("error", "Invalid date format");
      return res.redirect(`/listings/${id}/book`);
    }

    if (checkOutDate <= checkInDate) {
      req.flash("error", "Check-out date must be after check-in date");
      return res.redirect(`/listings/${id}/book`);
    }

    // Calculate total price
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const totalPrice = daysDiff * listing.price;

    // Check for date conflicts
    const conflictingBooking = await Booking.findOne({
      listing: id,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate }
        }
      ]
    });

    if (conflictingBooking) {
      req.flash("error", "These dates are not available");
      return res.redirect(`/listings/${id}/book`);
    }

    const bookingData = {
      listing: id,
      user: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: parseInt(guests),
      totalPrice,
      phoneNumber: phoneNumber.trim(),
      specialRequests: specialRequests ? specialRequests.trim() : ""
    };

    console.log("Creating booking with data:", bookingData);

    const newBooking = new Booking(bookingData);
    const savedBooking = await newBooking.save();
    
    console.log("Booking saved successfully:", savedBooking._id);
    req.flash("success", "Booking created successfully!");
    res.redirect("/bookings");

  } catch (error) {
    console.error("Booking creation error:", error);
    console.error("Error details:", error.message);
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      req.flash("error", `Validation Error: ${errorMessages.join(', ')}`);
    } else {
      req.flash("error", `Error creating booking: ${error.message}`);
    }
    res.redirect(`/listings/${req.params.id}/book`);
  }
};

// Show single booking
module.exports.showBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("listing")
      .populate("user");

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/bookings");
    }

    // Check if user owns this booking or is the listing owner
    if (!booking.user._id.equals(req.user._id) && !booking.listing.owner.equals(req.user._id)) {
      req.flash("error", "You don't have permission to view this booking");
      return res.redirect("/bookings");
    }

    res.render("bookings/show.ejs", { booking });
  } catch (error) {
    req.flash("error", "Error loading booking details");
    res.redirect("/bookings");
  }
};

// Update booking status
module.exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId).populate("listing");

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/bookings");
    }

    // Only listing owner can update booking status
    if (!booking.listing.owner.equals(req.user._id)) {
      req.flash("error", "You don't have permission to update this booking");
      return res.redirect("/bookings");
    }

    booking.status = status;
    await booking.save();

    req.flash("success", `Booking ${status} successfully!`);
    res.redirect(`/bookings/${bookingId}`);

  } catch (error) {
    req.flash("error", "Error updating booking status");
    res.redirect("/bookings");
  }
};

// Cancel booking
module.exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/bookings");
    }

    // Only booking owner can cancel
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You don't have permission to cancel this booking");
      return res.redirect("/bookings");
    }

    // Can only cancel pending or confirmed bookings
    if (!["pending", "confirmed"].includes(booking.status)) {
      req.flash("error", "This booking cannot be cancelled");
      return res.redirect("/bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/bookings");

  } catch (error) {
    req.flash("error", "Error cancelling booking");
    res.redirect("/bookings");
  }
};

// Get bookings for listing owner
module.exports.listingBookings = async (req, res) => {
  try {
    const userListings = await Listing.find({ owner: req.user._id });
    const listingIds = userListings.map(listing => listing._id);
    
    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate("listing")
      .populate("user")
      .sort({ createdAt: -1 });

    res.render("bookings/manage.ejs", { bookings });
  } catch (error) {
    req.flash("error", "Error fetching listing bookings");
    res.redirect("/listings");
  }
};