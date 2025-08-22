import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Content from '@/models/Content';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { creatorId } = await params;
    
    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get creator profile
    const creator = await User.findById(creatorId).select('-password');
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Check if current user is subscribed to this creator
    const isSubscribed = currentUser.isSubscribedTo(creatorId);

    // Check if current user is following this creator
    const isFollowing = currentUser.following.includes(creatorId);

    // Get follower count for the creator
    const followerCount = await User.countDocuments({
      following: creatorId
    });

    // Count creator's content
    const contentCount = await Content.countDocuments({ creator: creatorId });

    const response = {
      _id: creator._id,
      name: creator.name,
      email: creator.email,
      image: creator.image,
      profileImage: creator.profileImage,
      role: creator.role,
      bio: creator.bio,
      coverImage: creator.coverImage,
      subscriptionPrice: creator.subscriptionPrice || 0,
      isVerified: creator.isVerified,
      isSubscribed,
      isFollowing,
      followerCount,
      contentCount,
      subscriberCount: creator.subscriberCount || 0,
      createdAt: creator.createdAt,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
