// models/Application.js (Extracted from admission.js)
import mongoose from 'mongoose';

const AdmissionSchema = new mongoose.Schema({
    submissionDate: { type: Date, default: Date.now },
    pupilName: String,
    dateOfBirth: Date,
    fatherName: String,
    motherName: String,
    admissionClass: String,
    formDetails: Object,
    uploadedFilesInfo: [{
        fieldname: String,
        originalname: String,
        mimetype: String,
        size: Number,
        cloudinaryUrl: String,
        cloudinaryPublicId: String
    }]
});

export const Application = mongoose.model('Application', AdmissionSchema);