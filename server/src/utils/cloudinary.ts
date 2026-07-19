import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../lib/logger';

// Configure Cloudinary from env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/** Returns true when all Cloudinary credentials are present. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Local uploads directory used when Cloudinary is not configured (dev fallback).
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

/** Map common image mime types to file extensions for the local fallback. */
function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpg';
  }
}

/**
 * Uploads an image buffer and returns a URL that can be rendered in an <img>.
 * Prefers Cloudinary; when it is not configured, saves the file to a locally
 * served uploads folder and returns a relative "/uploads/<file>" URL so profile
 * pictures still work in development.
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'profiles',
  mimeType: string = 'image/jpeg'
): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(fileBuffer, folder, 'image');
  }

  // Local fallback — persist to disk under UPLOAD_DIR/<folder>.
  const dir = path.join(UPLOAD_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${extFromMime(mimeType)}`;
  fs.writeFileSync(path.join(dir, fileName), fileBuffer);
  logger.warn(
    `Cloudinary not configured — saved image to local uploads folder (${folder}/${fileName}).`
  );
  return `/uploads/${folder}/${fileName}`;
}

/**
 * Uploads a resume PDF buffer. If Cloudinary is configured, uploads to Cloudinary;
 * otherwise saves locally under UPLOAD_DIR/resumes and returns a relative "/uploads/resumes/<file>" path.
 */
export async function uploadResumePdf(fileBuffer: Buffer): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(fileBuffer, 'resumes', 'raw');
  }

  const dir = path.join(UPLOAD_DIR, 'resumes');
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.pdf`;
  fs.writeFileSync(path.join(dir, fileName), fileBuffer);
  logger.warn(`Cloudinary not configured — saved resume to local uploads folder (resumes/${fileName}).`);
  return `/uploads/resumes/${fileName}`;
}


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
