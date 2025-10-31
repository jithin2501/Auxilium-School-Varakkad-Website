// routes/publicRoutes.js
import { Router } from 'express';
import * as controller from '../controllers/publicController.js';
import { admissionUpload, admissionFileFields } from '../middleware/uploadMiddleware.js';

const router = Router();

// Public API endpoints
router.post('/api/contact', controller.submitContact);
router.post('/api/submit-application', admissionUpload.fields(admissionFileFields), controller.submitApplication); 

// Public Data Endpoints
router.get('/gallery', controller.getPublicGallery);
router.get('/alumni', controller.getPublicAlumni);
router.get('/faculty', controller.getFaculty); 
router.get('/principal-message', controller.getPublicPrincipalMessage); 

// --------------------------------------------------------------------------
// --- NEW: PUBLIC ACHIEVEMENTS & RESULTS ROUTES ---
// --------------------------------------------------------------------------
router.get('/achievements', controller.getPublicAchievements);
router.get('/results', controller.getPublicResults);

// --------------------------------------------------------------------------
// --- NEW: PUBLIC DISCLOSURE ROUTE ---
// --------------------------------------------------------------------------
router.get('/disclosure', controller.getPublicDisclosures);

export default router;