// models/Alumnus.js (Extracted from admission.js)
import mongoose from 'mongoose';

const AlumnusSchema = new mongoose.Schema({
    name: { type: String, required: true },
    titleOrAchievement: { type: String, required: true },
    description: { type: String, required: true }, 
    graduationYear: { type: String, required: false },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
});

export const Alumnus = mongoose.model('Alumnus', AlumnusSchema);