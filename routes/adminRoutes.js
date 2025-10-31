// routes/adminRoutes.js
import { Router } from 'express';
import passport from 'passport';
import * as controller from '../controllers/adminController.js';
import { isAdmin, isSuperAdmin, noCache } from '../middleware/authMiddleware.js';
import { admissionUpload, galleryUpload, alumniUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

// --- AUTH ROUTES (View Rendering) ---
router.get('/', noCache, (req, res) => { 
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        res.render('dashboard'); 
    } else {
        res.render('login', { error: req.query.error });
    }
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/admin?error=true',
}), controller.loginPost); 

router.get('/logout', controller.logout);

// --- PROTECTED ROUTES (Admin or Superadmin) ---
router.get('/applications', isAdmin, controller.getApplications);
router.get('/applications/:id', isAdmin, controller.getAdmissionDetails);
router.delete('/applications/:id', isAdmin, controller.deleteApplication);

router.post('/gallery/upload', isAdmin, galleryUpload.single('mediaFile'), controller.uploadGalleryItem);
router.put('/gallery/:id', isAdmin, controller.updateGalleryItem);
router.delete('/gallery/:id', isAdmin, controller.deleteGalleryItem);

router.post('/alumni', isAdmin, alumniUpload.single('profilePhoto'), controller.createAlumnus);
router.put('/alumni/:id', isAdmin, controller.updateAlumnus);
router.delete('/alumni/:id', isAdmin, controller.deleteAlumnus);

// --- NEW: FACULTY & STAFF ROUTES ---
router.post('/faculty', isAdmin, alumniUpload.single('profilePhoto'), controller.createFaculty); 
router.put('/faculty/:id', isAdmin, controller.updateFaculty);
router.delete('/faculty/:id', isAdmin, controller.deleteFaculty);

// --- NEW: PRINCIPAL MESSAGE ROUTES ---
router.post('/principal-message', isAdmin, admissionUpload.single('principalPhoto'), controller.createPrincipalMessage); 
router.get('/principal-message', isAdmin, controller.getAdminPrincipalMessages);
router.put('/principal-message/:id', isAdmin, admissionUpload.single('principalPhoto'), controller.updatePrincipalMessage); 
router.delete('/principal-message/:id', isAdmin, controller.deletePrincipalMessage);

// --------------------------------------------------------------------------
// --- NEW: ACHIEVEMENTS & RESULTS ROUTES (using alumniUpload for single photo) ---
// --------------------------------------------------------------------------

// ACHIEVEMENTS
router.post('/achievements', isAdmin, alumniUpload.single('photo'), controller.createAchievement);
router.get('/achievements', isAdmin, controller.getAdminAchievements);
router.put('/achievements/:id', isAdmin, controller.updateAchievement);
router.delete('/achievements/:id', isAdmin, controller.deleteAchievement);

// ICSE & ISC RESULTS
router.post('/results', isAdmin, alumniUpload.single('photo'), controller.createResult);
router.get('/results', isAdmin, controller.getAdminResults);
router.put('/results/:id', isAdmin, controller.updateResult);
router.delete('/results/:id', isAdmin, controller.deleteResult);

// --------------------------------------------------------------------------
// --- NEW: DISCLOSURE DOCUMENTS ROUTES (using admissionUpload for single PDF/file) ---
// --------------------------------------------------------------------------
router.post('/disclosure', isAdmin, admissionUpload.single('documentFile'), controller.createDisclosureDocument);
router.get('/disclosure', isAdmin, controller.getAdminDisclosureDocuments);
router.delete('/disclosure/:id', isAdmin, controller.deleteDisclosureDocument);

// --------------------------------------------------------------------------
// --- SUPERADMIN ONLY ROUTES (User Management) ---
router.post('/create-user', isSuperAdmin, controller.createUser);
router.delete('/users/:id', isSuperAdmin, controller.deleteUser);
router.get('/users', isSuperAdmin, controller.getUsers);

export default router;