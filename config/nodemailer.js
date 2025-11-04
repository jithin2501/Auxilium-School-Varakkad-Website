// config/nodemailer.js
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    connectionTimeout: 60000, 
    socketTimeout: 60000,
    
    // --- ADDED DEBUGGING FLAGS ---
    logger: true, // Shows high-level status
    debug: true,  // Shows low-level SMTP command exchange (CRITICAL)
    // -----------------------------
    
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS // MUST be the App Password
    }
});