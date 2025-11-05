// config/nodemailer.js
import nodemailer from 'nodemailer';

// Switched to non-standard Port 2525 (a common fallback for Port 587/STARTTLS)
export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 2525, // Non-standard port often left open on cloud hosts
    secure: false, // Must be false for port 2525 (uses STARTTLS implicitly)
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS // MUST be the Gmail App Password
    },
    timeout: 10000 
});