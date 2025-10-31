// middleware/logMiddleware.js
import { ActivityLog } from '../models/ActivityLog.js';

// Extracted from admission.js
export const logActivity = async (req, action, details) => {
    if (!req.isAuthenticated()) return;
    try {
        await ActivityLog.create({
            userId: req.user._id,
            username: req.user.username,
            action: action,
            details: details,
        });
    } catch (error) {
        console.error('Failed to save activity log:', error);
    }
};