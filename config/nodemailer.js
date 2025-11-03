// config/nodemailer.js
import nodemailer from 'nodemailer';

// Use explicit host and port settings for reliability
// Port 465 with 'secure: true' is generally the most stable for Gmail.
export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports (like 587)
    // Optional: Increase timeout to 60 seconds (default is 30) 
    // to give the connection more time before failing.
    connectionTimeout: 60000, 
    socketTimeout: 60000,
    auth: { 
        // These environment variables MUST be an App Password for Gmail
        // if your account has 2FA enabled.
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});