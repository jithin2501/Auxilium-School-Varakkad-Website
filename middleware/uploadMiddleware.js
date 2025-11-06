// middleware/uploadMiddleware.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// --- Multer Memory Storage ---
export const admissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

export const galleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

export const alumniUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// --- Admission File Fields ---
export const admissionFileFields = [
  { name: "file_tc", maxCount: 1 },
  { name: "file_birth", maxCount: 1 },
  { name: "file_aadhar", maxCount: 1 },
  { name: "file_parent_id", maxCount: 1 },
  { name: "file_student_photo", maxCount: 5 },
  { name: "file_passport", maxCount: 1 },
];

// --- Cloudinary Upload (Fixed for PDFs) ---
export const uploadToCloudinary = async (buffer, folder, mimetype, options = {}) => {
  return new Promise((resolve, reject) => {
    // Determine if the file is a PDF
    const isPdf = mimetype.includes("pdf");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? "raw" : "auto", // ✅ Force 'raw' for PDFs
        access_mode: "public",                // ✅ Makes file publicly accessible
        type: "upload",                       // ✅ Forces public delivery endpoint
        use_filename: true,                   // ✅ Keeps original filename
        unique_filename: false,               // ✅ Prevents random hash
        format: isPdf ? "pdf" : undefined,    // ✅ Ensures proper .pdf extension
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // ✅ Stream the raw file buffer directly (no base64 corruption)
    uploadStream.end(buffer);
  });
};

// --- Cloudinary Delete Helper ---
export const deleteFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return;
  try {
    const results = await cloudinary.api.delete_resources(publicIds);
    console.log("Cloudinary bulk deletion results:", results);
  } catch (error) {
    console.error("Cloudinary Bulk Deletion Error:", error);
  }
};

export { cloudinary };
