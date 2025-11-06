// middleware/uploadMiddleware.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// --- Cloudinary Config ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// --- Multer Memory Storage Setup ---
export const admissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

export const galleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

export const alumniUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// --- File Field Definitions ---
export const admissionFileFields = [
  { name: 'file_tc', maxCount: 1 },
  { name: 'file_birth', maxCount: 1 },
  { name: 'file_aadhar', maxCount: 1 },
  { name: 'file_parent_id', maxCount: 1 },
  { name: 'file_student_photo', maxCount: 5 },
  { name: 'file_passport', maxCount: 1 },
];

// --- Binary-Safe Cloudinary Upload Helper (FIXED) ---
export const uploadToCloudinary = async (buffer, folder, mimetype, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: mimetype.includes('pdf') ? 'raw' : 'auto',
        access_mode: 'public',   // ✅ Publicly accessible
        type: 'upload',
        use_filename: true,      // ✅ Keep original filename
        unique_filename: false,  // ✅ Prevent random hash
        format: mimetype.includes('pdf') ? 'pdf' : undefined,
        ...options,              // Merge with custom options
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // ✅ Stream the file buffer directly (avoids base64 corruption)
    uploadStream.end(buffer);
  });
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
