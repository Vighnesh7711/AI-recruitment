import { v2 as cloudinary } from 'cloudinary';
import logger from '../lib/logger';

// Configure Cloudinary from env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Uploads a file buffer to Cloudinary and returns the secure_url.
 * If Cloudinary is not configured, logs a warning and returns a placeholder mock URL.
 */
export function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'recruitment',
  resourceType: 'auto' | 'raw' | 'image' = 'auto'
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      logger.warn(
        'Cloudinary is not fully configured (missing env variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET). Falling back to placeholder mock URL.'
      );
      // Return a mock URL
      const mockId = Math.random().toString(36).substring(7);
      const ext = resourceType === 'raw' ? 'bin' : 'pdf';
      resolve(
        `https://res.cloudinary.com/mock-cloud/image/upload/v1234567890/mock_resume_${mockId}.${ext}`
      );
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed:', error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Cloudinary upload result was empty'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}
