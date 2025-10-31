// models/ContactMessage.js (Extracted from admission.js)
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    subject: String,
    message: String,
    date: { type: Date, default: Date.now }
});

export const ContactMessage = mongoose.model('ContactMessage', contactSchema);