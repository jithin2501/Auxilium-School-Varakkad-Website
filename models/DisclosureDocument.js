// models/DisclosureDocument.js (Conceptual)
import mongoose from 'mongoose';

const disclosureDocumentSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: ['Affiliation', 'NOC', 'Minority Certificate', 'Building Fitness Certificate'] 
    },
    title: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 100
    },
    cloudinaryUrl: { 
        type: String, 
        required: true 
    },
    cloudinaryPublicId: { 
        type: String, 
        required: true 
    },
    uploadDate: {
        type: Date,
        default: Date.now 
    }
});

export const DisclosureDocument = mongoose.model('DisclosureDocument', disclosureDocumentSchema);