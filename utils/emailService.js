const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // or your email service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send password reset email
module.exports.sendResetEmail = async (email, resetUrl) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request - Airbnb Clone',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your account.</p>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FF5A5F; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>Or copy and paste this link in your browser:</p>
                    <p>${resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
        
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};
