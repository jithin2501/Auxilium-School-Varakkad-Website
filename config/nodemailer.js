// config/nodemailer.js
import nodemailer from 'nodemailer';

// Switched to Port 587 (STARTTLS) configuration
export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Must be false for port 587
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    // CRITICAL: Explicitly enable TLS/STARTTLS protocol
    tls: {
        rejectUnauthorized: false // Sometimes needed in strict network environments
    }
});