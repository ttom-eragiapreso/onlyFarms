import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const unlink = promisify(fs.unlink);

// Local storage directory
const STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await access(STORAGE_DIR);
  } catch {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
}

/**
 * Upload a file to local storage
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export async function uploadToLocal(buffer, originalName, mimeType) {
  await ensureStorageDir();

  const fileId = uuidv4();
  const fileExtension = path.extname(originalName);
  const fileName = `${fileId}${fileExtension}`;
  const filePath = path.join(STORAGE_DIR, fileName);

  // Write file to disk
  await writeFile(filePath, buffer);

  // Return file information
  return {
    public_id: fileId,
    secure_url: `/uploads/${fileName}`,
    url: `/uploads/${fileName}`,
    bytes: buffer.length,
    format: fileExtension.slice(1), // Remove the dot
    resource_type: mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'raw',
    created_at: new Date().toISOString(),
    original_filename: path.parse(originalName).name,
    display_name: originalName
  };
}

/**
 * Upload an image to local storage with basic processing
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export async function uploadImageToLocal(buffer, originalName, options = {}) {
  const { folder = '', public_id } = options;
  
  await ensureStorageDir();

  // Create folder if specified
  if (folder) {
    const folderPath = path.join(STORAGE_DIR, folder);
    try {
      await access(folderPath);
    } catch {
      await mkdir(folderPath, { recursive: true });
    }
  }

  const fileId = public_id || uuidv4();
  const fileExtension = path.extname(originalName);
  const fileName = `${fileId}${fileExtension}`;
  const filePath = path.join(STORAGE_DIR, folder, fileName);
  const urlPath = folder ? `/uploads/${folder}/${fileName}` : `/uploads/${fileName}`;

  // Write file to disk
  await writeFile(filePath, buffer);

  return {
    public_id: fileId,
    secure_url: urlPath,
    url: urlPath,
    bytes: buffer.length,
    format: fileExtension.slice(1),
    resource_type: 'image',
    created_at: new Date().toISOString(),
    original_filename: path.parse(originalName).name,
    folder: folder || undefined
  };
}

/**
 * Upload a video to local storage
 * @param {Buffer} buffer - Video buffer
 * @param {string} originalName - Original filename
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export async function uploadVideoToLocal(buffer, originalName, options = {}) {
  const { folder = 'videos', public_id } = options;
  
  await ensureStorageDir();

  // Create folder if specified
  if (folder) {
    const folderPath = path.join(STORAGE_DIR, folder);
    try {
      await access(folderPath);
    } catch {
      await mkdir(folderPath, { recursive: true });
    }
  }

  const fileId = public_id || uuidv4();
  const fileExtension = path.extname(originalName);
  const fileName = `${fileId}${fileExtension}`;
  const filePath = path.join(STORAGE_DIR, folder, fileName);
  const urlPath = `/uploads/${folder}/${fileName}`;

  // Write file to disk
  await writeFile(filePath, buffer);

  // Generate a simple thumbnail URL (placeholder)
  const thumbnailUrl = `/uploads/${folder}/${fileId}_thumb.jpg`;

  return {
    public_id: fileId,
    secure_url: urlPath,
    url: urlPath,
    bytes: buffer.length,
    format: fileExtension.slice(1),
    resource_type: 'video',
    duration: null, // Would need video processing library to get actual duration
    created_at: new Date().toISOString(),
    original_filename: path.parse(originalName).name,
    folder: folder || undefined,
    // For video thumbnails in a real app, you'd generate these with ffmpeg or similar
    thumbnail_url: thumbnailUrl
  };
}

/**
 * Delete a file from local storage
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} folder - Optional folder name
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromLocal(publicId, folder = '') {
  try {
    // Try to find and delete the file
    // Since we don't know the extension, we'll need to check common ones
    const commonExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi', '.webm'];
    
    for (const ext of commonExtensions) {
      const fileName = `${publicId}${ext}`;
      const filePath = path.join(STORAGE_DIR, folder, fileName);
      
      try {
        await access(filePath);
        await unlink(filePath);
        return { result: 'ok' };
      } catch {
        // File doesn't exist with this extension, continue
        continue;
      }
    }
    
    return { result: 'not found' };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { result: 'error', error: error.message };
  }
}

/**
 * Generate an optimized URL for local files
 * @param {string} publicId - The public ID of the file
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
export function getOptimizedUrl(publicId, options = {}) {
  // For local development, we can't do real-time transformations
  // Just return the original URL
  const { folder = '', format = 'jpg' } = options;
  const fileName = `${publicId}.${format}`;
  return folder ? `/uploads/${folder}/${fileName}` : `/uploads/${fileName}`;
}

/**
 * Generate a video thumbnail URL
 * @param {string} publicId - The public ID of the video
 * @param {Object} options - Thumbnail options
 * @returns {string} Thumbnail URL
 */
export function getVideoThumbnail(publicId, options = {}) {
  // For local development, return a placeholder
  // In production with real video processing, this would generate actual thumbnails
  const { folder = 'videos' } = options;
  return `/uploads/${folder}/${publicId}_thumb.jpg`;
}

/**
 * Check if we're in development mode and should use local storage
 * @returns {boolean} True if using local storage
 */
export function isUsingLocalStorage() {
  return process.env.NODE_ENV === 'development' || process.env.USE_LOCAL_STORAGE === 'true';
}

// Helper function to convert file to buffer (for use in API routes)
export async function fileToBuffer(file) {
  try {
    const bytes = await file.arrayBuffer();
    return Buffer.from(bytes);
  } catch (error) {
    console.error('Error converting file to buffer:', error);
    throw new Error('Failed to process file');
  }
}

export default {
  uploadToLocal,
  uploadImageToLocal,
  uploadVideoToLocal,
  deleteFromLocal,
  getOptimizedUrl,
  getVideoThumbnail,
  isUsingLocalStorage,
  fileToBuffer
};
