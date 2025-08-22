import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { creatorId } = await context.params;
    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    await connectDB();

    if (session.user.id === creatorId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const user = await User.findById(session.user.id).select('following');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!Array.isArray(user.following)) {
      user.following = [];
    }

    const isFollowing = user.following.some(id => id.toString() === creatorId);

    if (isFollowing) {
      // Unfollow
      user.following = user.following.filter(id => id.toString() !== creatorId);
    } else {
      // Follow
      user.following.push(creatorId);
    }

    await user.save();

    // Compute follower count
    const followerCount = await User.countDocuments({ following: creatorId });

    return NextResponse.json({
      isFollowing: !isFollowing,
      followerCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
