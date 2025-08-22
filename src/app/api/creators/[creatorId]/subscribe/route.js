import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { creatorId } = params;
    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    await connectDB();

    if (session.user.id === creatorId) {
      return NextResponse.json({ error: 'Cannot subscribe to yourself' }, { status: 400 });
    }

    const subscriber = await User.findById(session.user.id).select('subscribedTo');
    const creator = await User.findById(creatorId).select('subscribers subscriptionPrice');

    if (!subscriber || !creator) {
      return NextResponse.json({ error: 'User or creator not found' }, { status: 404 });
    }

    // Check if already subscribed and still active
    const now = new Date();
    const existingSubIndex = subscriber.subscribedTo.findIndex(sub => sub.creator.toString() === creatorId && sub.isActive && (!sub.subscriptionEndDate || sub.subscriptionEndDate > now));

    if (existingSubIndex >= 0) {
      // Already subscribed - return current state
      return NextResponse.json({ isSubscribed: true }, { status: 200 });
    }

    // Create a basic 30-day subscription window
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    subscriber.subscribedTo.push({
      creator: creatorId,
      subscribedAt: now,
      subscriptionEndDate: endDate,
      isActive: true,
    });

    // Mirror on creator doc
    creator.subscribers.push({
      user: session.user.id,
      subscribedAt: now,
      subscriptionEndDate: endDate,
      isActive: true,
    });

    await subscriber.save();
    await creator.save();

    return NextResponse.json({ isSubscribed: true }, { status: 200 });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
