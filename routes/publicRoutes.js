// routes/publicRoutes.js
import { Router } from 'express';
import * as controller from '../controllers/publicController.js';
import { admissionUpload, admissionFileFields } from '../middleware/uploadMiddleware.js';

const router = Router();

// Public API endpoints
router.post('/api/contact', controller.submitContact);
router.post('/api/submit-application', admissionUpload.fields(admissionFileFields), controller.submitApplication);

// Signed URL endpoint for private PDFs
router.get('/api/signed-pdf/:publicId', controller.getSignedPdfUrl);

// Public Data Endpoints
router.get('/api/gallery', controller.getPublicGallery);
router.get('/api/alumni', controller.getPublicAlumni);
router.get('/api/faculty', controller.getFaculty);
router.get('/api/principal-message', controller.getPublicPrincipalMessage);
router.get('/api/achievements', controller.getPublicAchievements);
router.get('/api/results', controller.getPublicResults);
router.get('/api/disclosure', controller.getPublicDisclosures);

export default router;
