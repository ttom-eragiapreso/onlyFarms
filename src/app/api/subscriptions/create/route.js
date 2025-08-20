import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToMongoDB } from '@/lib/mongodb';
import { createCustomer, createPrice, createSubscription } from '@/lib/stripe';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { creatorId, priceAmount } = await request.json();

    if (!creatorId || !priceAmount) {
      return NextResponse.json(
        { error: 'Creator ID and price amount are required' }, 
        { status: 400 }
      );
    }

    if (priceAmount < 1) {
      return NextResponse.json(
        { error: 'Minimum subscription price is $1.00' }, 
        { status: 400 }
      );
    }

    await connectToMongoDB();

    // Get subscriber (current user)
    const subscriber = await User.findOne({ email: session.user.email });
    if (!subscriber) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get creator
    const creator = await User.findById(creatorId);
    if (!creator || creator.role !== 'creator') {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Check if user is already subscribed
    if (subscriber.isSubscribedTo(creatorId)) {
      return NextResponse.json(
        { error: 'Already subscribed to this creator' }, 
        { status: 400 }
      );
    }

    // Don't allow self-subscription
    if (subscriber._id.toString() === creatorId) {
      return NextResponse.json(
        { error: 'Cannot subscribe to yourself' }, 
        { status: 400 }
      );
    }

    // Create or get Stripe customer for subscriber
    let customerId = subscriber.stripeCustomerId;
    if (!customerId) {
      const customer = await createCustomer(
        subscriber.email,
        subscriber.name,
        { userId: subscriber._id.toString() }
      );
      customerId = customer.id;
      
      // Update subscriber with Stripe customer ID
      await User.findByIdAndUpdate(subscriber._id, { 
        stripeCustomerId: customerId 
      });
    }

    // Create or get Stripe price for this creator's subscription
    let stripePriceId = creator.stripePriceId;
    if (!stripePriceId || creator.subscriptionPrice !== priceAmount) {
      const { price } = await createPrice(
        priceAmount,
        'usd',
        'month',
        null
      );
      stripePriceId = price.id;
      
      // Update creator with Stripe price ID
      await User.findByIdAndUpdate(creatorId, { 
        stripePriceId: stripePriceId,
        subscriptionPrice: priceAmount
      });
    }

    // Create Stripe subscription
    const subscription = await createSubscription(
      customerId,
      stripePriceId,
      {
        creatorId: creatorId,
        subscriberId: subscriber._id.toString(),
        subscriptionType: 'monthly'
      }
    );

    // Create transaction record
    const transaction = new Transaction({
      payer: subscriber._id,
      payee: creator._id,
      amount: Math.round(priceAmount * 100), // Convert to cents
      currency: 'USD',
      type: 'subscription',
      status: 'pending',
      stripePaymentIntentId: subscription.latest_invoice.payment_intent.id,
      description: `Monthly subscription to ${creator.name}`,
      metadata: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: stripePriceId,
      },
    });

    await transaction.save();

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      priceId: stripePriceId,
      customerId: customerId,
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
