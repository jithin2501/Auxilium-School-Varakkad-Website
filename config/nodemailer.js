// config/nodemailer.js
import nodemailer from 'nodemailer';


// Extracted from admission.js
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    // These environment variables are loaded automatically by Render
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});