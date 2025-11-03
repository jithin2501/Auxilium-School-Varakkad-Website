// middleware/uploadMiddleware.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';


// --- Cloudinary Config (Extracted from admission.js) ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// --- Multer Storage Definitions (Extracted from admission.js) ---
// Note: Multer is configured to use memory storage for Cloudinary upload
export const admissionUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
export const galleryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
export const alumniUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// --- File Field Definitions (Extracted from admission.js) ---
export const admissionFileFields = [
    { name: 'file_tc', maxCount: 1 },
    { name: 'file_birth', maxCount: 1 },
    { name: 'file_aadhar', maxCount: 1 },
    { name: 'file_parent_id', maxCount: 1 },
    { name: 'file_student_photo', maxCount: 5 }
];

// --- Cloudinary Helpers (Extracted from admission.js) ---
export const uploadToCloudinary = (buffer, folder, mimetype) => {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return cloudinary.uploader.upload(dataUri, { folder, resource_type: "auto" });
};

export const deleteFromCloudinary = async (publicIds) => {
    if (!Array.isArray(publicIds) || publicIds.length === 0) return;
    try {
        const results = await cloudinary.api.delete_resources(publicIds);
        console.log(`Cloudinary bulk deletion results:`, results);
    } catch (error) {
        console.error('Cloudinary Bulk Deletion Error:', error);
    }
};

export { cloudinary }; // Export the instance for destroy calls in controllers