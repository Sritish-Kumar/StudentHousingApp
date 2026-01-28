import cloudinary from "../config/cloudinary.config.js";

/**
 * Upload images to Cloudinary
 * @param {Array<Buffer>} imageBuffers - Array of image buffers to upload
 * @param {Array<string>} filenames - Array of original filenames
 * @returns {Promise<Array<string>>} - Array of secure URLs
 */
export async function uploadImagesToCloudinary(imageBuffers, filenames) {
  try {
    const uploadPromises = imageBuffers.map((buffer, index) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "student-housing/properties",
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
            public_id: `${Date.now()}_${index}_${filenames[index].split(".")[0]}`,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          },
        );
        uploadStream.end(buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload images to Cloudinary");
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Cloudinary image URL to delete
 * @returns {Promise<void>}
 */
export async function deleteImageFromCloudinary(imageUrl) {
  try {
    // Extract public_id from URL
    const parts = imageUrl.split("/");
    const filename = parts[parts.length - 1];
    const publicId = `student-housing/properties/${filename.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    // Don't throw error, just log it
  }
}
