import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { creatorId } = params;

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }

    await connectDB();

    // Get current user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if creator exists
    const creator = await User.findById(creatorId);
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Can't follow yourself
    if (creatorId === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const isCurrentlyFollowing = currentUser.following?.includes(creatorId) || false;
    
    if (isCurrentlyFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(session.user.id, {
        $pull: { following: creatorId }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(session.user.id, {
        $addToSet: { following: creatorId }
      });
    }

    // Get updated follower count
    const followerCount = await User.countDocuments({
      following: creatorId
    });

    return NextResponse.json({
      isFollowing: !isCurrentlyFollowing,
      followerCount
    });

  } catch (error) {
    console.error('Error following/unfollowing creator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
