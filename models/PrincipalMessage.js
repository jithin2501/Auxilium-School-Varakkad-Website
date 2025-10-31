import mongoose from 'mongoose';

const PrincipalMessageSchema = new mongoose.Schema({
    // Principal's photo details (assuming Cloudinary or similar upload)
    cloudinaryUrl: {
        type: String,
        required: false, // Photo can be optional for an update, but required for a new message
        trim: true
    },
    cloudinaryPublicId: {
        type: String,
        required: false,
        trim: true,
    },
    // Principal's Name
    principalName: { // ⬅️ CHANGED from 'name'
        type: String,
        required: true,
        trim: true
    },
    // The main message/description
    messageText: { // ⬅️ CHANGED from 'message'
        type: String,
        required: true,
        trim: true
    },
    // Principal's Qualification
    qualification: {
        type: String,
        required: false,
        trim: true
    },
    // Tenure Years
    fromYear: { // ⬅️ NEW
        type: String,
        required: false,
        trim: true
    },
    toYear: { // ⬅️ NEW
        type: String,
        required: false,
        trim: true
    },
}, { timestamps: true });

// Since there should only be one Principal's Message at a time, 
// the controller will handle saving/updating the single document.
const PrincipalMessage = mongoose.model('PrincipalMessage', PrincipalMessageSchema);

export { PrincipalMessage };