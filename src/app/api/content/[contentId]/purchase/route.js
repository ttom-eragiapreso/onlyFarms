import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Content from '@/models/Content';
import User from '@/models/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId } = params;
    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    await connectDB();

    const content = await Content.findById(contentId).select('creator accessType price purchases totalEarnings');
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.accessType !== 'pay-per-view') {
      return NextResponse.json({ error: 'Content is not pay-per-view' }, { status: 400 });
    }

    // Check existing purchase
    const alreadyPurchased = content.purchases.some(p => p.user.toString() === session.user.id);
    if (alreadyPurchased) {
      return NextResponse.json({ hasAccess: true }, { status: 200 });
    }

    // Record purchase
    const amount = content.price || 0;
    content.purchases.push({ user: session.user.id, amount });
    content.totalEarnings = (content.totalEarnings || 0) + amount;

    await content.save();

    // Update basic accounting (optional)
    await User.findByIdAndUpdate(session.user.id, { $inc: { totalSpent: amount } });
    await User.findByIdAndUpdate(content.creator, { $inc: { totalEarnings: amount } });

    return NextResponse.json({ hasAccess: true }, { status: 200 });
  } catch (error) {
    console.error('Error purchasing content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
