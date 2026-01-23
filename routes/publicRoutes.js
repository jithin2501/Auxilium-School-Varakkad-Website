// routes/publicRoutes.js
import { Router } from 'express';
import * as controller from '../controllers/publicController.js';
import { admissionUpload, admissionFileFields } from '../middleware/uploadMiddleware.js';
import { Announcement } from '../models/Announcement.js';

const router = Router();

// Public API endpoints
router.post('/api/contact', controller.submitContact);
router.post('/api/submit-application', admissionUpload.fields(admissionFileFields), controller.submitApplication); 

// Public Data Endpoints (UPDATED: All prefixed with /api)
router.get('/api/gallery', controller.getPublicGallery);
router.get('/api/alumni', controller.getPublicAlumni);
router.get('/api/faculty', controller.getFaculty); 
router.get('/api/principal-message', controller.getPublicPrincipalMessage); 

// --- NEW: PUBLIC ACHIEVEMENTS & RESULTS ROUTES ---
router.get('/api/achievements', controller.getPublicAchievements);
router.get('/api/results', controller.getPublicResults);

// --- NEW: PUBLIC DISCLOSURE ROUTE ---
router.get('/api/disclosure', controller.getPublicDisclosures);

router.get('/api/announcement', async (req, res) => {
    try {
        const data = await Announcement.findOne({ isActive: true });
        
        // Auto-hide logic: if today is past the expiry date, hide it.
        if (data && data.expiryDate && new Date() > new Date(data.expiryDate)) {
            return res.json({ success: true, data: null });
        }
        
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, data: null });
    }
});

export default router;