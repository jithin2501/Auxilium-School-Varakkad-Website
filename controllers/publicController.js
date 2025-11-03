// controllers/publicController.js
import { ContactMessage } from '../models/ContactMessage.js';
import { Application } from '../models/Application.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { Alumnus } from '../models/Alumnus.js';
import { Faculty } from '../models/Faculty.js'; 
import { PrincipalMessage } from '../models/PrincipalMessage.js'; 
import { Achievement } from '../models/Achievement.js'; 
import { Result } from '../models/Result.js'; 
import { DisclosureDocument } from '../models/DisclosureDocument.js'; // NEW IMPORT: Disclosure Document Model
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/uploadMiddleware.js';
import { transporter } from '../config/nodemailer.js'; // <- ADDED: Import Nodemailer Transporter

// --- Contact Form (POST /api/contact) ---
export const submitContact = async (req, res) => {
    try {
        const { name, email, mobile, subject, message } = req.body;
        if (!name || !email || !message)
            return res.status(400).json({ success: false, message: 'Missing required fields: name, email, or message.' });
        
        const msg = new ContactMessage(req.body);
        await msg.save();
        
        // --- START EMAIL NOTIFICATION CODE (Contact Form) ---
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'auxiliumvarakkad@gmail.com', 
            subject: `New Contact Message: ${subject || 'No Subject'}`,
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mobile:</strong> ${mobile || 'N/A'}</p>
                <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
                <br>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
                <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Nodemailer Error (Contact):", error);
            } else {
                console.log("Contact Email Sent:", info.response);
            }
        });
        // --- END EMAIL NOTIFICATION CODE ---

        res.json({ success: true, message: 'Message saved and email notification sent!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error saving message' });
    }
};

// --- Admission Submission (POST /api/submit-application) ---
export const submitApplication = async (req, res) => {
    const uploadedPublicIds = [];
    try {
        const formData = req.body;
        const uploadedFiles = req.files;
        const filesInfo = [];

        for (const field in uploadedFiles) {
            for (const file of uploadedFiles[field]) {
                const result = await uploadToCloudinary(file.buffer, `admissions/${field}`, file.mimetype);
                uploadedPublicIds.push(result.public_id);
                filesInfo.push({
                    fieldname: field,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    cloudinaryUrl: result.secure_url,
                    cloudinaryPublicId: result.public_id
                });
            }
        }

        const appData = new Application({
            pupilName: formData.pupilName,
            dateOfBirth: formData.dateOfBirth,
            fatherName: formData.fatherName,
            motherName: formData.motherName,
            admissionClass: formData.admissionClass,
            formDetails: formData,
            uploadedFilesInfo: filesInfo
        });

        await appData.save();

        // --- START EMAIL NOTIFICATION CODE (Admission Form) ---
        // Generates clickable links for uploaded files
        const fileList = filesInfo.map(f => `
            <p style="margin: 5px 0 0 0;">
                <strong>${f.fieldname.replace('file_', '').replace('_', ' ')}:</strong> 
                <a href="${f.cloudinaryUrl}" target="_blank">${f.originalname}</a>
            </p>`).join('');
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'auxiliumvarakkad@gmail.com', 
            subject: `NEW ADMISSION: ${formData.pupilName} (${formData.admissionClass})`,
            html: `
                <h3>New Admission Application Received</h3>
                <p><strong>Pupil Name:</strong> ${formData.pupilName}</p>
                <p><strong>Class Applied:</strong> ${formData.admissionClass}</p>
                <p><strong>Father's Mobile:</strong> ${formData.fatherMobile}</p>
                <p><strong>Date of Birth:</strong> ${formData.dateOfBirth}</p>
                <br>
                <h4>Uploaded Documents:</h4>
                ${fileList}
                <br>
                <p><small>View full application details in the Admin Panel.</small></p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Nodemailer Error (Admission):", error);
            } else {
                console.log("Admission Email Sent:", info.response);
            }
        });
        // --- END EMAIL NOTIFICATION CODE ---
        
        res.json({ success: true, message: 'Application saved and email notification sent!', appId: appData._id });
    } catch (err) {
        console.error(err);
        if (uploadedPublicIds.length > 0) {
            console.log('Attempting cleanup of failed upload assets...');
            await deleteFromCloudinary(uploadedPublicIds);
        }
        res.status(500).json({ success: false, message: 'Error submitting application' });
    }
};

// --- Public Gallery (GET /gallery) ---
export const getPublicGallery = async (req, res) => {
    try {
        const items = await GalleryItem.find().sort({ uploadDate: -1 });
        res.json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching gallery' });
    }
};

// --- Public Alumni (GET /alumni) ---
export const getPublicAlumni = async (req, res) => {
    try {
        const profiles = await Alumnus.find().sort({ uploadDate: -1 });
        res.json({ success: true, profiles });
    } catch (err) {
        console.error('Error fetching alumni:', err);
        res.status(500).json({ success: false, message: 'Error fetching alumni profiles' });
    }
};

// --- Public Faculty List (GET /faculty) ---
export const getFaculty = async (req, res) => {
    try {
        const profiles = await Faculty.find().sort({ name: 1 });
        res.json({ success: true, profiles });
    } catch (error) {
        console.error('Public Get Faculty Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching faculty data.' });
    }
};

// --- Public Principal Message (EXISTING) ---
export const getPublicPrincipalMessage = async (req, res) => {
    try {
        // Fetch the single latest message
        const latestMessage = await PrincipalMessage.findOne().sort({ createdAt: -1 })
            .select('principalName messageText qualification fromYear toYear cloudinaryUrl'); // ⬅️ UPDATED: Select correct fields

        if (!latestMessage) {
            return res.status(404).json({ success: false, message: 'No principal message found.' });
        }

        res.json({ success: true, profile: latestMessage });
    } catch (error) {
        console.error('Public Get Principal Message Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching principal message.' });
    }
};


// =========================================================================
// NEW: PUBLIC ACHIEVEMENTS
// =========================================================================

export const getPublicAchievements = async (req, res) => {
    try {
        // Fetch all achievements, sorted by most recent first
        const achievements = await Achievement.find().sort({ uploadDate: -1 });
        res.json({ success: true, achievements });
    } catch (error) {
        console.error('Public Get Achievements Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching achievements.' });
    }
};

// =========================================================================
// NEW: PUBLIC RESULTS (ICSE & ISC)
// =========================================================================

export const getPublicResults = async (req, res) => {
    try {
        // Fetch all results, sorted by type (ICSE/ISC) and then by percentage (descending)
        const results = await Result.find().sort({ type: 1, percentage: -1 });
        res.json({ success: true, results });
    } catch (error) {
        console.error('Public Get Results Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching results.' });
    }
};

// =========================================================================
// NEW: PUBLIC DISCLOSURE DOCUMENTS
// =========================================================================

export const getPublicDisclosures = async (req, res) => {
    try {
        // Fetch all disclosure documents, sorted by type for grouping in frontend
        const disclosures = await DisclosureDocument.find().sort({ type: 1, title: 1 });
        res.json({ success: true, disclosures });
    } catch (error) {
        console.error('Public Get Disclosures Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching disclosure documents.' });
    }
};