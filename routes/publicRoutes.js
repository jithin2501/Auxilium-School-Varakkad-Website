// routes/publicRoutes.js
import { Router } from 'express';
import * as controller from '../controllers/publicController.js';
import { admissionUpload, admissionFileFields } from '../middleware/uploadMiddleware.js';

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

export default router;