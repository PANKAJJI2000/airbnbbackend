const express= require("express");
const router=express.Router();
const wrapAsync= require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js")
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage});
const { getValidToken, getClientId } = require('../utils/mapplsToken');
const Listing = require('../models/listing.js'); // Add this import
const Booking = require('../models/booking');

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(listingController.createListing)
    );
    
  // New route
 router.get("/new",isLoggedIn,listingController.renderNewForm);

router.route("/:id").get(wrapAsync(listingController.showListing))
.put(
  isLoggedIn,
  isOwner,
  upload.single('listing[image]'),  // Ensure the field name matches here
  validateListing,
  wrapAsync(listingController.updateListing)
)
.delete(isLoggedIn,isOwner, wrapAsync(listingController.destroyListing));

// edit route
  router.get("/:id/edit", isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm)
);

// Show route
router.get("/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let mapplsToken = null;
  let mapplsClientId = null;
  
  try {
    mapplsToken = await getValidToken();
    mapplsClientId = getClientId();
  } catch (error) {
    console.error('Error getting MapmyIndia token:', error);
  }

  res.render("listings/show.ejs", { 
    listing, 
    mapplsToken, 
    mapplsClientId 
  });
}));

// Show booking form
router.get("/:id/book", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        res.render("bookings/new", { listing });
    } catch (err) {
        console.error('Error loading booking form:', err);
        req.flash("error", "Unable to load booking form");
        res.redirect("/listings");
    }
});

// Create booking
router.post("/:id/book", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests, phoneNumber, specialRequests, duration, totalPrice } = req.body;
        
        console.log('Booking request data:', req.body);
        
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        // Validate required fields
        if (!checkIn || !checkOut || !guests || !phoneNumber || !duration || !totalPrice) {
            req.flash("error", "Please fill in all required fields");
            return res.redirect(`/listings/${id}/book`);
        }
        
        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            req.flash("error", "Invalid dates provided");
            return res.redirect(`/listings/${id}/book`);
        }
        
        if (checkOutDate <= checkInDate) {
            req.flash("error", "Check-out date must be after check-in date");
            return res.redirect(`/listings/${id}/book`);
        }
        
        const booking = new Booking({
            listing: id,
            user: req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(guests),
            phoneNumber: phoneNumber.trim(),
            specialRequests: specialRequests ? specialRequests.trim() : '',
            duration: parseInt(duration),
            totalPrice: parseFloat(totalPrice),
            paymentMethod: 'Credit Card',
            paymentStatus: 'pending',
            status: 'pending'
        });
        
        await booking.save();
        console.log('Booking created successfully:', booking._id);
        
        req.flash("success", "Booking created successfully!");
        res.redirect("/bookings");
        
    } catch (err) {
        console.error('Booking creation error:', err);
        req.flash("error", `Failed to create booking: ${err.message}`);
        res.redirect("back");
    }
});

module.exports=router;


