import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Content from '@/models/Content';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get current user with following list
    const currentUser = await User.findById(session.user.id).select('following');
    const followingIds = currentUser?.following?.map(id => id.toString()) || [];

    // Get all users except the current user
    const creators = await User.find({
      _id: { $ne: session.user.id },
      role: { $in: ['creator', 'admin'] } // Only show creators
    }).select('name email profileImage coverImage bio subscriptionPrice createdAt');

    // For each creator, get their content stats and tags
    const creatorsWithStats = await Promise.all(creators.map(async (creator) => {
      // Get content count
      const contentCount = await Content.countDocuments({ creator: creator._id });
      
      // Get unique tags from their content
      const contentTags = await Content.distinct('tags', { creator: creator._id });
      
      // Check if current user is following this creator
      const isFollowing = followingIds.includes(creator._id.toString());
      
      // Get follower count
      const followerCount = await User.countDocuments({
        following: creator._id
      });

      return {
        _id: creator._id,
        name: creator.name,
        email: creator.email,
        profileImage: creator.profileImage,
        coverImage: creator.coverImage,
        bio: creator.bio,
        subscriptionPrice: creator.subscriptionPrice,
        contentCount,
        contentTags,
        isFollowing,
        followerCount,
        createdAt: creator.createdAt
      };
    }));

    // Sort by follower count (most popular first)
    creatorsWithStats.sort((a, b) => b.followerCount - a.followerCount);

    return NextResponse.json({
      creators: creatorsWithStats
    });

  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
