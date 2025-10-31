// models/ActivityLog.js (Extracted from admission.js)
import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
});

export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);