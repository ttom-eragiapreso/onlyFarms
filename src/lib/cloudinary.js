import { v2 as cloudinary } from 'cloudinary';
import { 
  isUsingLocalStorage, 
  uploadImageToLocal, 
  uploadVideoToLocal, 
  deleteFromLocal, 
  getOptimizedUrl as getLocalOptimizedUrl,
  getVideoThumbnail as getLocalVideoThumbnail,
  fileToBuffer
} from './local-storage.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper functions for file uploads with local storage fallback
export const uploadImage = async (fileOrBuffer, originalName = 'image', options = {}) => {
  // Use local storage in development
  if (isUsingLocalStorage()) {
    const buffer = fileOrBuffer instanceof Buffer ? fileOrBuffer : await fileToBuffer(fileOrBuffer);
    return uploadImageToLocal(buffer, originalName, {
      folder: 'images',
      ...options
    });
  }

  try {
    const result = await cloudinary.uploader.upload(fileOrBuffer, {
      resource_type: 'image',
      folder: 'onlyfarms/images',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
        { format: 'auto' }
      ],
      ...options,
    });
    return result;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const uploadVideo = async (fileOrBuffer, originalName = 'video', options = {}) => {
  // Use local storage in development
  if (isUsingLocalStorage()) {
    const buffer = fileOrBuffer instanceof Buffer ? fileOrBuffer : await fileToBuffer(fileOrBuffer);
    return uploadVideoToLocal(buffer, originalName, {
      folder: 'videos',
      ...options
    });
  }

  try {
    const result = await cloudinary.uploader.upload(fileOrBuffer, {
      resource_type: 'video',
      folder: 'onlyfarms/videos',
      transformation: [
        { width: 1280, height: 720, crop: 'limit', quality: 'auto:good' },
        { format: 'mp4' }
      ],
      eager: [
        { width: 640, height: 480, crop: 'limit', format: 'mp4', quality: 'auto:low' },
        { width: 1280, height: 720, crop: 'limit', format: 'mp4', quality: 'auto:good' },
      ],
      eager_async: true,
      ...options,
    });
    return result;
  } catch (error) {
    console.error('Video upload error:', error);
    throw new Error('Failed to upload video');
  }
};

export const uploadProfileImage = async (fileOrBuffer, userId) => {
  if (isUsingLocalStorage()) {
    const buffer = fileOrBuffer instanceof Buffer ? fileOrBuffer : await fileToBuffer(fileOrBuffer);
    return uploadImageToLocal(buffer, `profile_${userId}.jpg`, {
      folder: 'profiles',
      public_id: `profile_${userId}`
    });
  }

  return uploadImage(fileOrBuffer, `profile_${userId}.jpg`, {
    public_id: `onlyfarms/profiles/${userId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
      { format: 'auto' }
    ],
  });
};

export const uploadCoverImage = async (fileOrBuffer, userId) => {
  if (isUsingLocalStorage()) {
    const buffer = fileOrBuffer instanceof Buffer ? fileOrBuffer : await fileToBuffer(fileOrBuffer);
    return uploadImageToLocal(buffer, `cover_${userId}.jpg`, {
      folder: 'covers',
      public_id: `cover_${userId}`
    });
  }

  return uploadImage(fileOrBuffer, `cover_${userId}.jpg`, {
    public_id: `onlyfarms/covers/${userId}`,
    overwrite: true,
    transformation: [
      { width: 1200, height: 400, crop: 'fill', quality: 'auto:good' },
      { format: 'auto' }
    ],
  });
};

// Delete file from Cloudinary or local storage
export const deleteFile = async (publicId, folder = '') => {
  if (isUsingLocalStorage()) {
    return deleteFromLocal(publicId, folder);
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
};

// Generate optimized URLs
export const getOptimizedUrl = (publicId, options = {}) => {
  if (isUsingLocalStorage()) {
    return getLocalOptimizedUrl(publicId, options);
  }

  return cloudinary.url(publicId, {
    quality: 'auto:good',
    format: 'auto',
    ...options,
  });
};

export const getVideoThumbnail = (publicId, options = {}) => {
  if (isUsingLocalStorage()) {
    return getLocalVideoThumbnail(publicId, options);
  }

  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width: 640, height: 360, crop: 'fill', quality: 'auto:good' }
    ],
    ...options,
  });
};

// Export the fileToBuffer helper
export { fileToBuffer };
