/**
 * Cloudinary Utility for Image Upload
 * Handles receipt image uploads to Cloudinary
 */

const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer from multer
 * @param {String} folder - Cloudinary folder name (default: 'receipts')
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
async function uploadImageToCloudinary(fileBuffer, folder = "receipts") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
        format: "jpg",
        transformation: [
          { width: 1200, crop: "limit" }, // Limit max width for processing
          { quality: "auto" }, // Optimize quality
        ],
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public_id of the image
 * @returns {Promise<Object>} Deletion result
 */
async function deleteImageFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
}

/**
 * Get optimized URL for an image
 * @param {String} publicId - Cloudinary public_id
 * @param {Object} options - Transformation options
 * @returns {String} Optimized image URL
 */
function getOptimizedUrl(publicId, options = {}) {
  const {
    width = 800,
    height = null,
    quality = "auto",
    format = "auto",
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    quality,
    format,
    crop: "limit",
    fetch_format: "auto",
  });
}

module.exports = {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  getOptimizedUrl,
  cloudinary,
};
