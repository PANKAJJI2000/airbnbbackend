const Listing = require("../models/listing");
const Review = require("../models/review");
const mongoose = require("mongoose");

module.exports.createReview = async (req, res) => {
    const id = req.params.id;
    
    console.log('Review submission data:', req.body);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid listing ID format");
        return res.redirect("/listings");
    }
    
    try {
        const listing = await Listing.findById(id);
        
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        // Validate review data
        if (!req.body.review) {
            req.flash("error", "Review data is required");
            return res.redirect(`/listings/${id}`);
        }
        
        if (!req.body.review.rating || !req.body.review.comment) {
            req.flash("error", "Please provide both rating and comment");
            return res.redirect(`/listings/${id}`);
        }
        
        const newReview = new Review(req.body.review);
        newReview.author = req.user._id;
        
        await newReview.save();
        
        // Update listing without re-validating the entire document
        await Listing.findByIdAndUpdate(
            id,
            { $push: { reviews: newReview._id } },
            { runValidators: false } // Skip validation to avoid geometry error
        );
        
        console.log('Review created successfully:', newReview._id);
        
        req.flash("success", "New Review Created");
        res.redirect(`/listings/${listing._id}`);
        
    } catch (error) {
        console.error("Error saving review:", error);
        req.flash("error", `Failed to create review: ${error.message}`);
        res.redirect(`/listings/${id}`);
    }
};

module.exports.destroyReview = async (req, res) => {
    try {
        let { id, reviewId } = req.params;
        
        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
            req.flash("error", "Invalid ID format");
            return res.redirect("/listings");
        }
        
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        
        req.flash("success", "Review Deleted");
        res.redirect(`/listings/${id}`);
        
    } catch (error) {
        console.error("Error deleting review:", error);
        req.flash("error", "Failed to delete review");
        res.redirect(`/listings/${id}`);
    }
};