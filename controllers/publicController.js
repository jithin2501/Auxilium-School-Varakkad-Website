// controllers/publicController.js
import { ContactMessage } from '../models/ContactMessage.js';
import { Application } from '../models/Application.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { Alumnus } from '../models/Alumnus.js';
import { Faculty } from '../models/Faculty.js';
import { PrincipalMessage } from '../models/PrincipalMessage.js';
import { Achievement } from '../models/Achievement.js';
import { Result } from '../models/Result.js';
import { DisclosureDocument } from '../models/DisclosureDocument.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/uploadMiddleware.js';
import { transporter } from '../config/nodemailer.js';
import { v2 as cloudinary } from 'cloudinary';

// --- Contact Form (POST /api/contact) ---
export const submitContact = async (req, res) => {
    try {
        const { name, email, mobile, subject, message } = req.body;
        if (!name || !email || !message)
            return res.status(400).json({ success: false, message: 'Missing required fields: name, email, or message.' });

        const msg = new ContactMessage(req.body);
        await msg.save();

        // --- EMAIL NOTIFICATION ---
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'jithinpjoji@gmail.com',
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
            if (error) console.error("Nodemailer Error (Contact):", error);
            else console.log("Contact Email Sent:", info.response);
        });

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

                const isPdf = file.mimetype.includes('pdf');

                const uploadOptions = {
                    resource_type: isPdf ? 'raw' : 'image',
                    access_mode: 'authenticated',   // 👈 PRIVATE storage
                    type: 'authenticated',
                    use_filename: true,
                    unique_filename: false,
                    format: isPdf ? 'pdf' : undefined
                };

                // Upload to Cloudinary
                const result = await uploadToCloudinary(file.buffer, `admissions/${field}`, file.mimetype, uploadOptions);
                uploadedPublicIds.push(result.public_id);

                filesInfo.push({
                    fieldname: field,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
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

        res.json({ success: true, message: 'Application saved successfully!', appId: appData._id });
    } catch (err) {
        console.error(err);
        if (uploadedPublicIds.length > 0) {
            console.log('Attempting cleanup of failed upload assets...');
            await deleteFromCloudinary(uploadedPublicIds);
        }
        res.status(500).json({ success: false, message: 'Error submitting application' });
    }
};

// --- Generate Signed PDF URL (Private Secure Access) ---
export const getSignedPdfUrl = async (req, res) => {
    try {
        const { publicId } = req.params;
        if (!publicId) return res.status(400).json({ success: false, message: 'Missing publicId parameter.' });

        const url = cloudinary.utils.private_download_url(publicId, 'pdf', {
            resource_type: 'raw',
            type: 'authenticated',
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        });

        res.json({ success: true, url });
    } catch (err) {
        console.error('Error generating signed link:', err);
        res.status(500).json({ success: false, message: 'Error creating signed URL.' });
    }
};

// --- Public Gallery (GET /gallery) ---
export const getPublicGallery = async (req, res) => {
    try {
        const items = await GalleryItem.find().sort({ uploadDate: -1 });
        res.json({ success: true, items });
    } catch (err) {
        console.error('Error fetching gallery', err);
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

// --- Public Principal Message (GET /principal-message) ---
export const getPublicPrincipalMessage = async (req, res) => {
    try {
        const latestMessage = await PrincipalMessage.findOne().sort({ createdAt: -1 })
            .select('principalName messageText qualification fromYear toYear cloudinaryUrl');

        if (!latestMessage) {
            return res.status(404).json({ success: false, message: 'No principal message found.' });
        }

        res.json({ success: true, profile: latestMessage });
    } catch (error) {
        console.error('Public Get Principal Message Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching principal message.' });
    }
};

// --- Public Achievements (GET /achievements) ---
export const getPublicAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find().sort({ uploadDate: -1 });
        res.json({ success: true, achievements });
    } catch (error) {
        console.error('Public Get Achievements Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching achievements.' });
    }
};

// --- Public Results (GET /results) ---
export const getPublicResults = async (req, res) => {
    try {
        const results = await Result.find().sort({ type: 1, percentage: -1 });
        res.json({ success: true, results });
    } catch (error) {
        console.error('Public Get Results Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching results.' });
    }
};

// --- Public Disclosures (GET /disclosures) ---
export const getPublicDisclosures = async (req, res) => {
    try {
        const disclosures = await DisclosureDocument.find().sort({ uploadDate: -1 });
        res.json({ success: true, disclosures });
    } catch (error) {
        console.error('Public Get Disclosures Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching disclosure documents.' });
    }
};
