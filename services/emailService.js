const nodemailer = require("nodemailer");

// 1. Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail", // Use well-known service or define host/port/secure
  auth: {
    user: process.env.USER_MAIL, // Your email address
    pass: process.env.USER_APP_PASSWORD, // Your generated App Password (not your regular account password)
  },
});

// 2. Define the email options (sender, recipient, subject, body)
export function sendResetEmail(userEmail,resetUrl) {

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
            h2 { color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px; }
            p { color: #555555; line-height: 1.6; }
            .button { 
                display: inline-block; margin: 20px 0; padding: 12px 25px; font-size: 16px;
                color: #ffffff !important; background-color: #007bff; border-radius: 5px; 
                text-decoration: none; font-weight: bold;
            }
            .warning { color: #cc0000; font-weight: bold; margin-top: 15px; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999; text-align: center; }
        </style>
    </head>
    <body>
    <div class="container">
        <h2>🔑 Password Reset Request</h2>
        <p>Hello,</p>
        <p>You recently requested to reset the password for your account.</p>
        <p>To proceed with resetting your password, please click the secure button below.</p>
        <div style="text-align: center;">
            <a href="${resetUrl}" class="button">
                Reset Your Password Now
            </a>
        </div>
        <p class="warning">⚠️ Important Security Information</p>
        <ul>
            <li>This link will **expire in 24 hours** for security reasons.</li>
            <li>If you **did not** request this, please ignore this email.</li>
        </ul>
        <p>The link is: <code>${resetUrl}</code></p>
        <div class="footer">
            <p>The [Your Company Name] Team</p>
        </div>
    </div>
    </body>
    </html>
`;
  const mailOptions = {
    from: "YOUR_EMAIL@gmail.com", // Sender address
    to: userEmail, // List of recipients
    subject: "Password Reset", // Subject line
    text:`Please use this link to reset your password: ${resetUrl}` , // Plain text body
    html: htmlContent// Optional: HTML body
  };

  // 3. Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {         
      console.log("Email sent successfully:", info.response);
      // return  `Password reset link is sent to your email. ${userEmail}`; // Replace with actual
    }
  });
}
