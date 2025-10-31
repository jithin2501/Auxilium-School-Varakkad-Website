// controllers/adminController.js

import { User } from '../models/User.js';
import { Application } from '../models/Application.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { Alumnus } from '../models/Alumnus.js';
import { Faculty } from '../models/Faculty.js'; 
import { PrincipalMessage } from '../models/PrincipalMessage.js'; 
import { Achievement } from '../models/Achievement.js'; 
import { Result } from '../models/Result.js'; 
import { DisclosureDocument } from '../models/DisclosureDocument.js'; // NEW IMPORT: Disclosure Document Model
import { logActivity } from '../middleware/logMiddleware.js';
import { uploadToCloudinary, deleteFromCloudinary, cloudinary } from '../middleware/uploadMiddleware.js'; 
import mongoose from 'mongoose'; 

// --- AUTH HANDLERS ---
export const loginPost = async (req, res) => {
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        try {
            await User.findByIdAndUpdate(req.user._id, { lastLogin: Date.now() });
            await logActivity(req, 'LOGIN', `Admin login successful. Username: ${req.user.username}`);
        } catch (error) {
            console.error('Login Post-Auth Error:', error);
        }
    }
    res.redirect('/admin');
};

export const logout = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        logActivity(req, 'LOGOUT', `Admin signed out. Username: ${req.user.username}`).then(() => {
            req.logout((err) => {
                if (err) { return next(err); }
                res.redirect('/admin');
            });
        });
    } else {
        res.redirect('/admin');
    }
};

// --- USER MANAGEMENT (Superadmin Only) ---
export const createUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const newUser = new User({ username, role: 'admin' });
        
        await User.register(newUser, password);
        await logActivity(req, 'USER_CREATED', `New admin user '${username}' created by ${req.user.username}.`);

        res.json({ success: true, message: `Admin user '${username}' created successfully!` });

    } catch (err) {
        if (err.name === 'UserExistsError') {
            return res.status(409).json({ success: false, message: 'User already exists.' });
        }
        console.error('New Admin Creation Error:', err);
        res.status(500).json({ success: false, message: 'Error creating user.' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        
        if (req.user._id.toString() === userIdToDelete) {
            return res.status(403).json({ success: false, message: 'Cannot delete your own account while logged in.' });
        }

        const user = await User.findById(userIdToDelete);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.role === 'superadmin') {
             return res.status(403).json({ success: false, message: 'Cannot delete a Superadmin account.' });
        }

        await User.findByIdAndDelete(userIdToDelete);
        
        await logActivity(req, 'USER_DELETED', `Deleted admin user: ${user.username}. ID: ${userIdToDelete} by ${req.user.username}`);

        res.json({ success: true, message: `Admin user '${user.username}' deleted successfully.` });

    } catch (err) {
        console.error('Admin User Deletion Error:', err);
        res.status(500).json({ success: false, message: 'Error deleting user.' });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['admin', 'superadmin'] } }, 'username lastLogin _id role').lean();
        
        const currentUserRole = req.user.role; 
        
        res.json({ success: true, users, currentUserRole });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching admin users.' });
    }
};

// --- APPLICATION & MESSAGE MANAGEMENT ---
export const getApplications = async (req, res) => {
    try {
        const admissions = await Application.find().sort({ submissionDate: -1 });
        const messages = await ContactMessage.find().sort({ date: -1 });

        const combined = [
            ...admissions.map(a => ({ ...a._doc, type: 'Admission', date: a.submissionDate, pupilName: a.pupilName, admissionClass: a.admissionClass, formDetails: a.formDetails })),
            ...messages.map(m => ({ ...m._doc, type: 'Contact', date: m.date, pupilName: m.name, admissionClass: 'N/A', formDetails: {} }))
        ].sort((a, b) => b.date - a.date);

        res.json({ success: true, applications: combined });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching applications' });
    }
};

export const getAdmissionDetails = async (req, res) => {
    try {
        const appData = await Application.findById(req.params.id);
        if (!appData)
            return res.status(404).json({ success: false, message: 'Application not found' });

        const getDocUrl = (field) => {
            const files = appData.uploadedFilesInfo.filter(f => f.fieldname === field);
            if (field === 'file_student_photo' && files.length > 0) {
                 return files[0].cloudinaryUrl;
            }
            const file = files[0];
            return file ? file.cloudinaryUrl : null;
        };

        const formatted = {
            _id: appData._id,
            pupilName: appData.pupilName,
            admissionClass: appData.admissionClass,
            dateOfBirth: appData.dateOfBirth,
            formDetails: appData.formDetails || {},
            documents: {
                file_birth: getDocUrl('file_birth'),
                file_aadhar: getDocUrl('file_aadhar'),
                file_tc: getDocUrl('file_tc'),
                file_student_photo: getDocUrl('file_student_photo'),
                file_parent_id: getDocUrl('file_parent_id')
            }
        };

        res.json({ success: true, application: formatted });
    } catch (err) {
        console.error('Error fetching single admission:', err);
        res.status(500).json({ success: false, message: 'Error fetching details' });
    }
};

export const deleteApplication = async (req, res) => {
    try {
        const appId = req.params.id;
        
        const application = await Application.findByIdAndDelete(appId);

        if (application) {
            const publicIds = application.uploadedFilesInfo.map(f => f.cloudinaryPublicId);
            await deleteFromCloudinary(publicIds);
            
            await logActivity(req, 'APP_DELETED', `Deleted admission application for pupil ID: ${appId}.`);
            return res.json({ success: true, message: 'Admission application deleted successfully.' });
        }
        
        const message = await ContactMessage.findByIdAndDelete(appId);

        if (message) {
            await logActivity(req, 'MSG_DELETED', `Deleted contact message ID: ${appId}.`);
            return res.json({ success: true, message: 'Contact message deleted successfully.' });
        }

        return res.status(404).json({ success: false, message: 'Application or message not found.' });

    } catch (err) {
        console.error('Application/Message Deletion Error:', err);
        res.status(500).json({ success: false, message: 'Error deleting application/message.' });
    }
};

// --- GALLERY CRUD ---
export const uploadGalleryItem = async (req, res) => {
    let uploadedPublicId = null;
    try {
        const { title, description, type } = req.body;
        if (!req.file) throw new Error('No media file uploaded.');
        
        const resourceType = type === 'video' ? 'video' : 'image';
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `gallery/${type}`,
            resource_type: resourceType
        });
        uploadedPublicId = result.public_id;

        const item = new GalleryItem({
            type, title, description,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        await item.save();
        await logActivity(req, 'GALLERY_UPLOAD', `Uploaded new ${type}: ${title}. ID: ${item._id}`);
        
        res.json({ success: true, item });
    } catch (err) {
        console.error(err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        res.status(500).json({ success: false, message: 'Error uploading gallery item' });
    }
};

export const updateGalleryItem = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required for update.' });
        }

        const item = await GalleryItem.findByIdAndUpdate(
            req.params.id, 
            { $set: { title: title, description: description || '' } }, 
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ success: false, message: 'Gallery item not found.' });
        }
        
        await logActivity(req, 'GALLERY_UPDATE', `Updated ${item.type} title/desc: ${title}. ID: ${item._id}`);

        res.json({ success: true, message: 'Gallery item updated successfully!', item });

    } catch (err) {
        console.error('Gallery Update Error:', err);
        res.status(500).json({ success: false, message: 'Error updating gallery item', error: err.message });
    }
};

export const deleteGalleryItem = async (req, res) => {
    try {
        const item = await GalleryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });

        const resourceType = item.type === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(item.cloudinaryPublicId, { resource_type: resourceType });
        
        await GalleryItem.findByIdAndDelete(req.params.id);
        
        await logActivity(req, 'GALLERY_DELETE', `Deleted ${item.type}: ${item.title}. ID: ${item._id}`);

        res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
        console.error('Gallery Deletion Error:', err);
        res.status(500).json({ success: false, message: 'Error deleting item. Check Cloudinary/DB status.' });
    }
};

// --- ALUMNI CRUD ---
export const createAlumnus = async (req, res) => {
    let uploadedPublicId = null;
    try {
        const { name, titleOrAchievement, description, graduationYear } = req.body;

        if (!req.file || !name || !titleOrAchievement || !description) {
            return res.status(400).json({ success: false, message: 'Missing profile photo, name, title, or description.' });
        }

        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'alumni_profiles',
            resource_type: 'image',
            transformation: { width: 400, height: 400, crop: "fill", gravity: "face" }
        });
        uploadedPublicId = result.public_id;

        const newAlumnus = new Alumnus({
            name, titleOrAchievement, description,
            graduationYear: graduationYear || 'N/A', 
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        await newAlumnus.save();
        await logActivity(req, 'ALUMNUS_CREATED', `Created new alumnus profile for: ${name}. ID: ${newAlumnus._id}`);
        
        res.json({ success: true, alumnus: newAlumnus, message: 'Alumnus profile created successfully.' });

    } catch (err) {
        console.error('Alumni Upload Error:', err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        res.status(500).json({ success: false, message: 'Error creating alumnus profile.' });
    }
};

export const updateAlumnus = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, titleOrAchievement, description, graduationYear } = req.body;

        const updatedAlumnus = await Alumnus.findByIdAndUpdate(
            id,
            { 
                name: name,
                titleOrAchievement: titleOrAchievement, 
                description: description,
                graduationYear: graduationYear
            },
            { new: true, runValidators: true }
        );

        if (!updatedAlumnus) {
            return res.status(404).json({ success: false, message: 'Alumnus profile not found.' });
        }

        await logActivity(req, 'ALUMNUS_UPDATED', `Updated alumnus profile: ${name}. ID: ${id}`);
        
        res.json({ success: true, alumnus: updatedAlumnus, message: 'Profile updated successfully.' });

    } catch (err) {
        console.error(' [ALUMNI UPDATE] Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: 'Validation failed: ' + messages.join(', ')});
        }
        res.status(500).json({ success: false, message: 'Error updating alumnus profile. Check server console for details.'});
    }
};

export const deleteAlumnus = async (req, res) => {
    const id = req.params.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid alumnus ID format.' });
        }

        const alumnus = await Alumnus.findById(id);
        if (!alumnus) {
            return res.status(404).json({ success: false, message: 'Alumnus profile not found.' });
        }

        if (alumnus.cloudinaryPublicId) {
             await cloudinary.uploader.destroy(alumnus.cloudinaryPublicId, { resource_type: 'image' });
        }

        const deletedAlumnus = await Alumnus.findByIdAndDelete(id);
        
        if (!deletedAlumnus) {
            throw new Error('Database deletion failed unexpectedly.'); 
        }

        await logActivity(req, 'ALUMNUS_DELETED', `Deleted alumnus profile: ${alumnus.name}. ID: ${id}`);

        res.json({ success: true, message: `Alumnus profile "${alumnus.name}" deleted successfully.` });

    } catch (err) {
        console.error(' [ALUMNI DELETE] Fatal error:', err);
        res.status(500).json({ success: false, message: 'Error deleting alumnus profile'});
    }
};

// --- FACULTY & STAFF CRUD (EXISTING) ---
export const createFaculty = async (req, res) => {
    let uploadedPublicId = null;
    try {
        const { name, subjectOrDesignation, qualification, description } = req.body;

        if (!req.file || !name || !subjectOrDesignation || !qualification || !description) {
            return res.status(400).json({ success: false, message: 'Missing photo, name, subject/designation, qualification, or description.' });
        }

        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'faculty_profiles', 
            resource_type: 'image',
            transformation: { width: 600, height: 600, crop: "fill", gravity: "face" }
        });
        uploadedPublicId = result.public_id;

        const newFaculty = new Faculty({
            name, subjectOrDesignation, qualification, description,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        await newFaculty.save();
        await logActivity(req, 'FACULTY_CREATED', `Created new faculty profile for: ${name}. ID: ${newFaculty._id}`);
        
        res.json({ success: true, faculty: newFaculty, message: 'Faculty profile created successfully.' });

    } catch (err) {
        console.error('Faculty Upload Error:', err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error creating faculty profile.';
        res.status(500).json({ success: false, message });
    }
};

export const updateFaculty = async (req, res) => {
    let uploadedPublicId = null;
    const id = req.params.id;
    const { name, subjectOrDesignation, qualification, description } = req.body;

    try {
        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
        }
        
        let updateData = { name, subjectOrDesignation, qualification, description };
        
        // NEW LOGIC: Handle new photo upload
        if (req.file) {
            // 1. Upload new photo to Cloudinary
            const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'faculty_profiles', 
                resource_type: 'image',
                transformation: { width: 600, height: 600, crop: "fill", gravity: "face" }
            });
            uploadedPublicId = result.public_id;

            // 2. Delete old photo from Cloudinary
            if (faculty.cloudinaryPublicId) {
                await cloudinary.uploader.destroy(faculty.cloudinaryPublicId, { resource_type: 'image' });
            }

            // 3. Update the data object for mongoose with new Cloudinary info
            updateData.cloudinaryUrl = result.secure_url;
            updateData.cloudinaryPublicId = result.public_id;
        }

        // 4. Update the profile in the database
        const updatedFaculty = await Faculty.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedFaculty) {
            return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
        }

        await logActivity(req, 'FACULTY_UPDATED', `Updated faculty profile: ${name}. ID: ${id}. Image updated: ${!!req.file}`);
        
        res.json({ success: true, faculty: updatedFaculty, message: 'Profile updated successfully.' });

    } catch (err) {
        console.error(' [FACULTY UPDATE] Error:', err);
        // Clean up the new file if DB update fails
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error updating faculty profile.';
        res.status(500).json({ success: false, message });
    }
};

export const deleteFaculty = async (req, res) => {
    const id = req.params.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid faculty ID format.' });
        }

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
        }

        if (faculty.cloudinaryPublicId) {
             await cloudinary.uploader.destroy(faculty.cloudinaryPublicId, { resource_type: 'image' });
        }

        const deletedFaculty = await Faculty.findByIdAndDelete(id);
        
        if (!deletedFaculty) {
            throw new Error('Database deletion failed unexpectedly.'); 
        }

        await logActivity(req, 'FACULTY_DELETED', `Deleted faculty profile: ${faculty.name}. ID: ${id}`);

        res.json({ success: true, message: `Faculty profile "${faculty.name}" deleted successfully.` });

    } catch (err) {
        console.error(' [FACULTY DELETE] Fatal error:', err);
        res.status(500).json({ success: false, message: 'Error deleting faculty profile'});
    }
};

// --- PRINCIPAL MESSAGE CRUD (EXISTING) ---
export const createPrincipalMessage = async (req, res) => {
    let uploadedPublicId = null;
    try {
        // ⬅️ UPDATED: Use correct destructuring for form fields
        const { messageText, principalName, qualification, fromYear, toYear } = req.body;

        if (!req.file || !messageText || !principalName) {
            return res.status(400).json({ success: false, message: 'Missing photo, message, or principal name.' });
        }

        // To ensure only ONE active message, delete all existing ones first.
        const existingMessages = await PrincipalMessage.find({});
        const publicIdsToCleanup = existingMessages.map(m => m.cloudinaryPublicId).filter(id => id);
        
        if (publicIdsToCleanup.length > 0) {
            await deleteFromCloudinary(publicIdsToCleanup);
            await PrincipalMessage.deleteMany({});
        }

        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'principal_message', 
            resource_type: 'image',
            transformation: { width: 600, height: 600, crop: "fill", gravity: "face" }
        });
        uploadedPublicId = result.public_id;

        // ⬅️ UPDATED: Use correct schema properties
        const newMessage = new PrincipalMessage({
            messageText, principalName, qualification, fromYear, toYear,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        await newMessage.save();
        await logActivity(req, 'PRIN_MSG_CREATED', `Created new Principal's Message by: ${principalName}. ID: ${newMessage._id}`);
        
        res.json({ success: true, message: 'Principal\'s message created successfully.', profile: newMessage });

    } catch (err) {
        console.error('Principal Message Upload Error:', err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        res.status(500).json({ success: false, message: 'Error creating Principal\'s message. Ensure required fields are filled and the file is an image.' });
    }
};

export const getAdminPrincipalMessages = async (req, res) => {
    try {
        const messages = await PrincipalMessage.find().sort({ createdAt: -1 });
        // The profiles key is used for consistency in the admin frontend fetching
        res.json({ success: true, profiles: messages });
    } catch (error) {
        console.error('Get Admin Principal Messages Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching principal messages.' });
    }
};

export const updatePrincipalMessage = async (req, res) => {
    let uploadedPublicId = null;
    const id = req.params.id;
    // ⬅️ UPDATED: Use correct destructuring for form fields
    const { messageText, principalName, qualification, fromYear, toYear } = req.body;

    try {
        const message = await PrincipalMessage.findById(id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Principal message not found.' });
        }
        
        // ⬅️ UPDATED: Use correct schema properties in the update data
        let updateData = { messageText, principalName, qualification, fromYear, toYear };
        
        if (req.file) {
            // 1. Upload new photo to Cloudinary
            const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'principal_message', 
                resource_type: 'image',
                transformation: { width: 600, height: 600, crop: "fill", gravity: "face" }
            });
            uploadedPublicId = result.public_id;

            // 2. Delete old photo from Cloudinary
            if (message.cloudinaryPublicId) {
                await cloudinary.uploader.destroy(message.cloudinaryPublicId, { resource_type: 'image' });
            }

            // 3. Update the data object for mongoose with new Cloudinary info
            updateData.cloudinaryUrl = result.secure_url;
            updateData.cloudinaryPublicId = result.public_id;
        }

        // 4. Update the profile in the database
        const updatedMessage = await PrincipalMessage.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        await logActivity(req, 'PRIN_MSG_UPDATED', `Updated Principal's Message: ${principalName}. ID: ${id}. Image updated: ${!!req.file}`);
        
        res.json({ success: true, message: 'Message updated successfully.', profile: updatedMessage });

    } catch (err) {
        console.error('[PRIN_MSG_UPDATE] Error:', err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error updating Principal\'s message.';
        res.status(500).json({ success: false, message });
    }
};

export const deletePrincipalMessage = async (req, res) => {
    const id = req.params.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid message ID format.' });
        }

        const message = await PrincipalMessage.findById(id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Principal message not found.' });
        }

        if (message.cloudinaryPublicId) {
             await cloudinary.uploader.destroy(message.cloudinaryPublicId, { resource_type: 'image' });
        }

        await PrincipalMessage.findByIdAndDelete(id);

        await logActivity(req, 'PRIN_MSG_DELETED', `Deleted Principal's Message: ${message.principalName}. ID: ${id}`);

        res.json({ success: true, message: `Principal's message deleted successfully.` });

    } catch (err) {
        console.error('[PRIN_MSG_DELETE] Fatal error:', err);
        res.status(500).json({ success: false, message: 'Error deleting principal message'});
    }
};


// =========================================================================
// NEW: ACHIEVEMENTS CRUD
// =========================================================================

export const createAchievement = async (req, res) => {
    let uploadedPublicId = null;
    try {
        const { title, description } = req.body;

        if (!req.file || !title || !description) {
            return res.status(400).json({ success: false, message: 'Missing photo, title, or description.' });
        }

        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'achievements',
            resource_type: 'image',
            transformation: { width: 800, height: 600, crop: "fill" } // Optimized for a landscape achievement image
        });
        uploadedPublicId = result.public_id;

        const newAchievement = new Achievement({
            title, description,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        await newAchievement.save();
        await logActivity(req, 'ACHIEVEMENT_CREATED', `Created new achievement: ${title}. ID: ${newAchievement._id}`);
        
        res.json({ success: true, achievement: newAchievement, message: 'Achievement created successfully.' });

    } catch (err) {
        console.error('Achievement Upload Error:', err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error creating achievement.';
        res.status(500).json({ success: false, message });
    }
};

export const getAdminAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find().sort({ uploadDate: -1 });
        res.json({ success: true, achievements });
    } catch (error) {
        console.error('Get Admin Achievements Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching achievements.' });
    }
};

export const updateAchievement = async (req, res) => {
    const id = req.params.id;
    const { title, description } = req.body;

    try {
        const updatedAchievement = await Achievement.findByIdAndUpdate(
            id,
            { title, description },
            { new: true, runValidators: true }
        );

        if (!updatedAchievement) {
            return res.status(404).json({ success: false, message: 'Achievement not found.' });
        }

        await logActivity(req, 'ACHIEVEMENT_UPDATED', `Updated achievement: ${title}. ID: ${id}`);
        
        res.json({ success: true, achievement: updatedAchievement, message: 'Achievement updated successfully.' });

    } catch (err) {
        console.error('Achievement Update Error:', err);
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error updating achievement.';
        res.status(500).json({ success: false, message });
    }
};

export const deleteAchievement = async (req, res) => {
    const id = req.params.id;

    try {
        const achievement = await Achievement.findById(id);
        if (!achievement) {
            return res.status(404).json({ success: false, message: 'Achievement not found.' });
        }

        if (achievement.cloudinaryPublicId) {
             await cloudinary.uploader.destroy(achievement.cloudinaryPublicId, { resource_type: 'image' });
        }

        await Achievement.findByIdAndDelete(id);

        await logActivity(req, 'ACHIEVEMENT_DELETED', `Deleted achievement: ${achievement.title}. ID: ${id}`);

        res.json({ success: true, message: `Achievement "${achievement.title}" deleted successfully.` });

    } catch (err) {
        console.error('Achievement Delete Error:', err);
        res.status(500).json({ success: false, message: 'Error deleting achievement.'});
    }
};

// =========================================================================
// NEW: RESULTS (ICSE & ISC) CRUD
// =========================================================================

export const createResult = async (req, res) => {
    let uploadedPublicId = null;
    try {
        const { type, studentName, percentage } = req.body;

        if (!req.file || !type || !studentName || !percentage) {
            return res.status(400).json({ success: false, message: 'Missing photo, type, name, or percentage.' });
        }
        
        // Validation for percentage (ensure it's a number between 0 and 100)
        const parsedPercentage = parseFloat(percentage);
        if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
             return res.status(400).json({ success: false, message: 'Invalid percentage value.' });
        }

        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const resultUpload = await cloudinary.uploader.upload(dataUri, {
            folder: `results/${type}`,
            resource_type: 'image',
            transformation: { width: 400, height: 400, crop: "fill", gravity: "face" } // Square photo for student
        });
        uploadedPublicId = resultUpload.public_id;

        const newResult = new Result({
            type, studentName, percentage: parsedPercentage,
            cloudinaryUrl: resultUpload.secure_url,
            cloudinaryPublicId: resultUpload.public_id
        });

        await newResult.save();
        await logActivity(req, 'RESULT_CREATED', `Created new ${type} result for: ${studentName} (${parsedPercentage}%).`);
        
        res.json({ success: true, result: newResult, message: 'Result entry created successfully.' });

    } catch (err) {
        console.error('Result Upload Error:', err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error creating result entry.';
        res.status(500).json({ success: false, message });
    }
};

export const getAdminResults = async (req, res) => {
    try {
        const results = await Result.find().sort({ type: 1, percentage: -1 }); // Group by type, then highest percentage first
        res.json({ success: true, results });
    } catch (error) {
        console.error('Get Admin Results Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching results.' });
    }
};

export const updateResult = async (req, res) => {
    const id = req.params.id;
    const { type, studentName, percentage } = req.body;

    try {
        const updateData = { type, studentName, percentage };
        
        const updatedResult = await Result.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedResult) {
            return res.status(404).json({ success: false, message: 'Result entry not found.' });
        }

        await logActivity(req, 'RESULT_UPDATED', `Updated ${type} result for: ${studentName} (${percentage}%). ID: ${id}`);
        
        res.json({ success: true, result: updatedResult, message: 'Result entry updated successfully.' });

    } catch (err) {
        console.error('Result Update Error:', err);
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error updating result entry.';
        res.status(500).json({ success: false, message });
    }
};

export const deleteResult = async (req, res) => {
    const id = req.params.id;

    try {
        const result = await Result.findById(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result entry not found.' });
        }

        if (result.cloudinaryPublicId) {
             await cloudinary.uploader.destroy(result.cloudinaryPublicId, { resource_type: 'image' });
        }

        await Result.findByIdAndDelete(id);

        await logActivity(req, 'RESULT_DELETED', `Deleted ${result.type} result for: ${result.studentName}. ID: ${id}`);

        res.json({ success: true, message: `Result entry deleted successfully.` });

    } catch (err) {
        console.error('Result Delete Error:', err);
        res.status(500).json({ success: false, message: 'Error deleting result entry.'});
    }
};

// =========================================================================
// NEW: DISCLOSURE DOCUMENT CRUD
// =========================================================================

export const createDisclosureDocument = async (req, res) => {
    let uploadedPublicId = null;
    try {
        const { title, type } = req.body;

        if (!req.file || !title || !type) {
            return res.status(400).json({ success: false, message: 'Missing file, title, or document type.' });
        }

        // 1. Upload the file (supporting PDF/Image)
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `public_disclosures/${type.replace(/\s/g, '_')}`,
            resource_type: 'auto' // Use auto to support PDF and Image
        });
        uploadedPublicId = result.public_id;

        // 2. Create and save the document entry
        const newDoc = new DisclosureDocument({
            type, title,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        await newDoc.save();
        await logActivity(req, 'DISCLOSURE_CREATED', `Uploaded new disclosure document: ${title} (${type}). ID: ${newDoc._id}`);
        
        res.json({ success: true, document: newDoc, message: 'Document uploaded successfully.' });

    } catch (err) {
        console.error('Disclosure Upload Error:', err);
        if (uploadedPublicId) {
            await deleteFromCloudinary([uploadedPublicId]);
        }
        const message = err.name === 'ValidationError' ? Object.values(err.errors).map(val => val.message).join(', ') : 'Error creating disclosure document.';
        res.status(500).json({ success: false, message });
    }
};

export const getAdminDisclosureDocuments = async (req, res) => {
    try {
        const documents = await DisclosureDocument.find().sort({ type: 1, title: 1 });
        res.json({ success: true, documents });
    } catch (error) {
        console.error('Get Admin Disclosures Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching disclosure documents.' });
    }
};

export const deleteDisclosureDocument = async (req, res) => {
    const id = req.params.id;

    try {
        const document = await DisclosureDocument.findById(id);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }

        if (document.cloudinaryPublicId) {
             const isPdf = document.cloudinaryUrl.toLowerCase().endsWith('.pdf') || document.cloudinaryUrl.includes('f_pdf');
             const resourceType = isPdf ? 'raw' : 'image';
             await cloudinary.uploader.destroy(document.cloudinaryPublicId, { resource_type: resourceType });
        }

        await DisclosureDocument.findByIdAndDelete(id);

        await logActivity(req, 'DISCLOSURE_DELETED', `Deleted disclosure document: ${document.title} (${document.type}). ID: ${id}`);

        res.json({ success: true, message: `Document "${document.title}" deleted successfully.` });

    } catch (err) {
        console.error('Disclosure Delete Error:', err);
        res.status(500).json({ success: false, message: 'Error deleting document.'});
    }
};