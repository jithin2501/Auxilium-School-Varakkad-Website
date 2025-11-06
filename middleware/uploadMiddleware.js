// middleware/uploadMiddleware.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// --- Cloudinary Config ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// --- Multer Storage Definitions ---
export const admissionUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

export const galleryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

export const alumniUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- File Field Definitions ---
export const admissionFileFields = [
    { name: 'file_tc', maxCount: 1 },
    { name: 'file_birth', maxCount: 1 },
    { name: 'file_aadhar', maxCount: 1 },
    { name: 'file_parent_id', maxCount: 1 },
    { name: 'file_student_photo', maxCount: 5 },
    { name: 'file_passport', maxCount: 1 } // ✅ Added field
];

// --- Cloudinary Upload Helper (FIXED) ---
export const uploadToCloudinary = async (buffer, folder, mimetype, options = {}) => {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;

    // ✅ Make sure uploads are public and accessible
    const defaultOptions = {
        folder,
        resource_type: 'auto',
        access_mode: 'public',  // <— ensures all files (including PDFs) are viewable
        type: 'upload',         // <— sets correct URL structure
        use_filename: true,     // <— keep original file name
        unique_filename: false, // <— prevent random hash in filename
        ...options              // allow override from controllers
    };

    return await cloudinary.uploader.upload(dataUri, defaultOptions);
};

// --- Cloudinary Delete Helper ---
export const deleteFromCloudinary = async (publicIds) => {
    if (!Array.isArray(publicIds) || publicIds.length === 0) return;
    try {
        const results = await cloudinary.api.delete_resources(publicIds);
        console.log('Cloudinary bulk deletion results:', results);
    } catch (error) {
        console.error('Cloudinary Bulk Deletion Error:', error);
    }
};

export { cloudinary };
