import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper functions for file uploads
export const uploadImage = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
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

export const uploadVideo = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
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

export const uploadProfileImage = async (file, userId) => {
  return uploadImage(file, {
    public_id: `onlyfarms/profiles/${userId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
      { format: 'auto' }
    ],
  });
};

export const uploadCoverImage = async (file, userId) => {
  return uploadImage(file, {
    public_id: `onlyfarms/covers/${userId}`,
    overwrite: true,
    transformation: [
      { width: 1200, height: 400, crop: 'fill', quality: 'auto:good' },
      { format: 'auto' }
    ],
  });
};

// Delete file from Cloudinary
export const deleteFile = async (publicId) => {
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
  return cloudinary.url(publicId, {
    quality: 'auto:good',
    format: 'auto',
    ...options,
  });
};

export const getVideoThumbnail = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width: 640, height: 360, crop: 'fill', quality: 'auto:good' }
    ],
    ...options,
  });
};
