// config/nodemailer.js
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,         // <-- CHANGED PORT
    secure: false,     // <-- MUST be false for port 587 (uses STARTTLS)
    connectionTimeout: 60000, 
    socketTimeout: 60000,
    logger: true, 
    debug: true,  
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS // App Password still required
    }
});