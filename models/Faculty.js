// models/Faculty.js
import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Faculty member name is required.'],
        trim: true
    },
    subjectOrDesignation: { // e.g., "Chemistry Teacher", "Principal"
        type: String,
        required: [true, 'Subject or Designation is required.'],
        trim: true
    },
    qualification: { // e.g., "M.Sc., B.Ed."
        type: String,
        required: [true, 'Qualification is required.'],
        trim: true
    },
    description: { // The small quote/description
        type: String,
        required: [true, 'Description/Quote is required.'],
        maxlength: [500, 'Description cannot exceed 500 characters.']
    },
    cloudinaryUrl: {
        type: String,
        required: true
    },
    cloudinaryPublicId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Faculty = mongoose.model('Faculty', facultySchema);