const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to access this page!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    const { review } = req.body;
    
    if (!review || !review.rating || !review.comment) {
        req.flash("error", "Please provide both rating and comment");
        return res.redirect("back");
    }
    
    if (review.rating < 1 || review.rating > 5) {
        req.flash("error", "Rating must be between 1 and 5");
        return res.redirect("back");
    }
    
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateBooking = (req, res, next) => {
    const { checkIn, checkOut, guests, phoneNumber } = req.body;
    
    // Check required fields
    if (!checkIn) {
        req.flash("error", "Check-in date is required");
        return res.redirect(`/listings/${req.params.id}/book`);
    }
    
    if (!checkOut) {
        req.flash("error", "Check-out date is required");
        return res.redirect(`/listings/${req.params.id}/book`);
    }
    
    if (!guests || guests < 1) {
        req.flash("error", "Number of guests is required and must be at least 1");
        return res.redirect(`/listings/${req.params.id}/book`);
    }
    
    if (!phoneNumber || phoneNumber.trim() === '') {
        req.flash("error", "Phone number is required");
        return res.redirect(`/listings/${req.params.id}/book`);
    }
    
    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        req.flash("error", "Invalid date format");
        return res.redirect(`/listings/${req.params.id}/book`);
    }
    
    if (checkOutDate <= checkInDate) {
        req.flash("error", "Check-out date must be after check-in date");
        return res.redirect(`/listings/${req.params.id}/book`);
    }
    
    // Check if dates are in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
        req.flash("error", "Check-in date cannot be in the past");
        return res.redirect(`/listings/${req.params.id}/book`);
    }
    
    next();
};