import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Achievement title is required.'],
        trim: true,
        maxlength: 150
    },
    description: {
        type: String,
        required: [true, 'Achievement description is required.'],
        trim: true,
        maxlength: 1000
    },
    cloudinaryUrl: {
        type: String,
        required: [true, 'Photo URL is required.']
    },
    cloudinaryPublicId: {
        type: String,
        required: [true, 'Cloudinary public ID is required.']
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Achievement = mongoose.model('Achievement', achievementSchema);
