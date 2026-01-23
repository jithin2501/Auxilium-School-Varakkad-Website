
import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: { type: String, default: 'Admission Poster' },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    updatedAt: { type: Date, default: Date.now }
});

export const Announcement = mongoose.model('Announcement', announcementSchema);