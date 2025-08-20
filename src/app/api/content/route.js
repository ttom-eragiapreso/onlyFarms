import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Content from '@/models/Content';
import { uploadImage, uploadVideo, fileToBuffer } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'creator') {
      return NextResponse.json({ error: 'Only creators can upload content' }, { status: 403 });
    }

    await connectDB();

    const formData = await request.formData();
    
    // Extract form fields
    const title = formData.get('title');
    const description = formData.get('description');
    const price = formData.get('price');
    const tags = formData.get('tags');
    const isPublic = formData.get('isPublic') === 'true';
    
    // Get all uploaded files
    const files = formData.getAll('files');
    
    if (!title || files.length === 0) {
      return NextResponse.json({ 
        error: 'Title and at least one file are required' 
      }, { status: 400 });
    }

    // Process uploaded files
    const mediaFiles = [];
    const uploadPromises = files.map(async (file) => {
      try {
        const buffer = await fileToBuffer(file);
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        let result;
        if (isImage) {
          result = await uploadImage(buffer, file.name, {
            folder: 'content/images',
          });
        } else if (isVideo) {
          result = await uploadVideo(buffer, file.name, {
            folder: 'content/videos',
          });
        } else {
          throw new Error('Unsupported file type');
        }

        return {
          url: result.secure_url,
          type: isImage ? 'image' : 'video',
          size: result.bytes,
          ...(isVideo && result.thumbnail_url && { thumbnail: result.thumbnail_url })
        };
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        throw error;
      }
    });

    try {
      const uploadResults = await Promise.all(uploadPromises);
      mediaFiles.push(...uploadResults);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to upload one or more files' 
      }, { status: 500 });
    }

    // Determine content type based on first media file
    const firstMediaType = mediaFiles[0]?.type;
    const contentType = firstMediaType === 'image' ? 'photo' : firstMediaType === 'video' ? 'video' : 'text';
    
    // Determine access type based on price and public status
    let accessType = 'free';
    if (price && parseFloat(price) > 0) {
      accessType = 'pay-per-view';
    } else if (!isPublic) {
      accessType = 'subscription';
    }

    // Create content document
    const contentData = {
      creator: session.user.id,
      title,
      description: description || '',
      type: contentType,
      mediaUrls: mediaFiles,
      accessType,
      price: price ? parseFloat(price) : 0,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      isPublished: isPublic,
      publishedAt: isPublic ? new Date() : null,
    };

    const content = new Content(contentData);
    await content.save();

    return NextResponse.json({
      message: 'Content created successfully',
      contentId: content._id,
      mediaCount: mediaFiles.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const creatorId = searchParams.get('creator');
    
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // If creator ID is specified, get that creator's content
    if (creatorId) {
      query.creator = creatorId;
    }
    
    // If not the creator themselves, only show published content or content they have access to
    if (!creatorId || creatorId !== session.user.id) {
      query.isPublished = true;
    }

    const content = await Content.find(query)
      .populate('creator', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Content.countDocuments(query);
    
    return NextResponse.json({
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
