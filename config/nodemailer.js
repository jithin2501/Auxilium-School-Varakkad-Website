// config/nodemailer.js
import nodemailer from 'nodemailer';

// Explicitly define host, port, and secure options for a robust connection
export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465, false for other ports like 587
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
});