// models/GalleryItem.js
import mongoose from 'mongoose';

const GallerySchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['photo', 'video'], 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
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

export const GalleryItem = mongoose.model('GalleryItem', GallerySchema);