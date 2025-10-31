import mongoose from 'mongoose';

// FIX: Removed the extra 'new' keyword that caused the TypeError.
const resultSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['ICSE', 'ISC'],
        required: [true, 'Result type (ICSE/ISC) is required.']
    },
    studentName: {
        type: String,
        required: [true, 'Student name is required.'],
        trim: true,
        maxlength: 100
    },
    percentage: {
        type: Number,
        required: [true, 'Percentage is required.'],
        min: [0, 'Percentage cannot be negative.'],
        max: [100, 'Percentage cannot exceed 100.'],
        // Store as a string if precision is a concern, but Number is fine for percentages
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

export const Result = mongoose.model('Result', resultSchema);
