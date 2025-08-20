import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToMongoDB } from '@/lib/mongodb';
import { verifyWebhookSignature } from '@/lib/stripe';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  let event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  await connectToMongoDB();

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleSubscriptionPaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleSubscriptionPaymentFailed(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionPaymentSucceeded(invoice) {
  console.log('Subscription payment succeeded:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  const amountPaid = invoice.amount_paid; // in cents

  try {
    // Find the subscriber by Stripe customer ID
    const subscriber = await User.findOne({ stripeCustomerId: customerId });
    if (!subscriber) {
      console.error('Subscriber not found for customer:', customerId);
      return;
    }

    // Find the transaction by payment intent
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: invoice.payment_intent
    });

    if (transaction) {
      // Mark transaction as completed
      await transaction.markCompleted();
      
      // Update subscriber's total spent
      await User.findByIdAndUpdate(subscriber._id, {
        $inc: { totalSpent: amountPaid }
      });

      // Update creator's total earnings
      const creator = await User.findById(transaction.payee);
      if (creator) {
        const netAmount = transaction.netAmount;
        await User.findByIdAndUpdate(creator._id, {
          $inc: { totalEarnings: netAmount }
        });
      }

      // Activate subscription in user records
      await activateSubscription(subscriber._id, transaction.payee, subscriptionId);
    }
    
  } catch (error) {
    console.error('Error handling subscription payment succeeded:', error);
  }
}

async function handleSubscriptionPaymentFailed(invoice) {
  console.log('Subscription payment failed:', invoice.id);
  
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: invoice.payment_intent
    });

    if (transaction) {
      await transaction.markFailed('Payment failed');
    }
  } catch (error) {
    console.error('Error handling subscription payment failed:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const customerId = subscription.customer;
  const creatorId = subscription.metadata?.creatorId;
  const subscriberId = subscription.metadata?.subscriberId;

  if (!creatorId || !subscriberId) {
    console.error('Missing creator or subscriber ID in subscription metadata');
    return;
  }

  try {
    // Add subscription relationship
    await activateSubscription(subscriberId, creatorId, subscription.id);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = subscription.customer;
  const status = subscription.status;

  try {
    // Handle subscription status changes
    if (status === 'past_due' || status === 'canceled' || status === 'unpaid') {
      await deactivateSubscriptionByStripeId(subscription.id);
    } else if (status === 'active') {
      // Reactivate if it was previously deactivated
      const creatorId = subscription.metadata?.creatorId;
      const subscriberId = subscription.metadata?.subscriberId;
      
      if (creatorId && subscriberId) {
        await activateSubscription(subscriberId, creatorId, subscription.id);
      }
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCanceled(subscription) {
  console.log('Subscription canceled:', subscription.id);
  
  try {
    await deactivateSubscriptionByStripeId(subscription.id);
  } catch (error) {
    console.error('Error handling subscription canceled:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (transaction && transaction.status === 'pending') {
      await transaction.markCompleted();
      
      // Update payment method details if available
      if (paymentIntent.charges?.data?.[0]) {
        const charge = paymentIntent.charges.data[0];
        const paymentMethod = charge.payment_method_details;
        
        if (paymentMethod?.card) {
          transaction.paymentMethod = {
            type: 'card',
            last4: paymentMethod.card.last4,
            brand: paymentMethod.card.brand,
            expiryMonth: paymentMethod.card.exp_month,
            expiryYear: paymentMethod.card.exp_year,
          };
          await transaction.save();
        }
      }
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);
  
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (transaction) {
      const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
      await transaction.markFailed(errorMessage);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function activateSubscription(subscriberId, creatorId, stripeSubscriptionId) {
  try {
    // Set subscription end date (30 days from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    // Add subscription to subscriber
    const subscriber = await User.findById(subscriberId);
    if (subscriber) {
      // Remove existing subscription if any
      subscriber.subscribedTo = subscriber.subscribedTo.filter(
        sub => sub.creator.toString() !== creatorId.toString()
      );
      
      // Add new subscription
      subscriber.subscribedTo.push({
        creator: creatorId,
        subscriptionEndDate,
        isActive: true,
        stripeSubscriptionId,
      });
      
      await subscriber.save();
    }

    // Add subscriber to creator's subscriber list
    const creator = await User.findById(creatorId);
    if (creator) {
      // Remove existing subscriber if any
      creator.subscribers = creator.subscribers.filter(
        sub => sub.user.toString() !== subscriberId.toString()
      );
      
      // Add new subscriber
      creator.subscribers.push({
        user: subscriberId,
        subscriptionEndDate,
        isActive: true,
        stripeSubscriptionId,
      });
      
      await creator.save();
    }

    console.log(`Activated subscription: ${subscriberId} -> ${creatorId}`);
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
}

async function deactivateSubscriptionByStripeId(stripeSubscriptionId) {
  try {
    // Find and deactivate in subscriber records
    await User.updateMany(
      { 'subscribedTo.stripeSubscriptionId': stripeSubscriptionId },
      { 
        $set: { 'subscribedTo.$.isActive': false }
      }
    );

    // Find and deactivate in creator records
    await User.updateMany(
      { 'subscribers.stripeSubscriptionId': stripeSubscriptionId },
      { 
        $set: { 'subscribers.$.isActive': false }
      }
    );

    console.log(`Deactivated subscription: ${stripeSubscriptionId}`);
  } catch (error) {
    console.error('Error deactivating subscription:', error);
    throw error;
  }
}
