// config/nodemailer.js
import nodemailer from 'nodemailer';

dotenv.config();

// Extracted from admission.js
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});