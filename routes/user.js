const express= require("express");
const router=express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
const { route } = require("./listing.js");
const { sendResetEmail } = require('../utils/emailService');

router.route("/signup").get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

router.route("/login").get(userController.renderLoinForm)
.post(saveRedirectUrl, passport.authenticate("local", 
    {failureRedirect: '/login', failureFlash: true}),
    userController.login
);

router.get("/logout", userController.logout);

// Direct login route (for /login instead of /users/login)
router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/listings");
  }
  res.render("users/login", {
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// Forgot Password - Show Form
router.get("/forgot-password", (req, res) => {
    res.render("users/forgotPassword.ejs");
});

// Forgot Password - Process
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            req.flash("error", "No account found with that email address.");
            return res.redirect("/forgot-password");
        }
        
        // Generate reset token
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();
        
        // Send email with reset link
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        
        try {
            await sendResetEmail(email, resetUrl);
            req.flash("success", "Password reset link has been sent to your email.");
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Fallback: show link in flash message for development
            req.flash("success", `Email service unavailable. Reset link: ${resetUrl}`);
        }
        
        res.redirect("/login");
        
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/forgot-password");
    }
});

// Reset Password - Show Form
router.get("/reset-password/:token", async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot-password");
        }
        
        res.render("users/resetPassword.ejs", { token: req.params.token });
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong.");
        res.redirect("/forgot-password");
    }
});

// Reset Password - Process
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match.");
            return res.redirect(`/reset-password/${req.params.token}`);
        }
        
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot-password");
        }
        
        // Update password using passport-local-mongoose method
        await user.setPassword(password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        req.flash("success", "Password has been reset successfully. Please login.");
        res.redirect("/login");
        
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/forgot-password");
    }
});

module.exports= router;