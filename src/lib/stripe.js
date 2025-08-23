import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Client-side Stripe promise
let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn('Stripe publishable key not found. Stripe functionality will be disabled.');
      return null;
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default stripe;
export { getStripe };

// Helper functions for common Stripe operations

// Create a customer
export const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return customer;
  } catch (error) {
    console.error('Create customer error:', error);
    throw new Error('Failed to create customer');
  }
};

// Create a payment intent for one-time payments (tips, content purchases)
export const createPaymentIntent = async (amount, currency = 'usd', customerId, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw new Error('Failed to create payment intent');
  }
};

// Create a subscription
export const createSubscription = async (customerId, priceId, metadata = {}) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });
    return subscription;
  } catch (error) {
    console.error('Create subscription error:', error);
    throw new Error('Failed to create subscription');
  }
};

// Create a price for subscriptions
export const createPrice = async (amount, currency = 'usd', interval = 'month', productId = null) => {
  try {
    let product = productId;
    if (!product) {
      const createdProduct = await stripe.products.create({
        name: 'Creator Subscription',
        description: 'Monthly subscription to creator content',
      });
      product = createdProduct.id;
    }

    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency,
      recurring: { interval },
      product,
    });
    return { price, product };
  } catch (error) {
    console.error('Create price error:', error);
    throw new Error('Failed to create price');
  }
};

// Cancel a subscription
export const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw new Error('Failed to cancel subscription');
  }
};

// Create a transfer to creator (for payouts)
export const createTransfer = async (amount, destination, metadata = {}) => {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination,
      metadata,
    });
    return transfer;
  } catch (error) {
    console.error('Create transfer error:', error);
    throw new Error('Failed to create transfer');
  }
};

// Create a connected account for creators
export const createConnectedAccount = async (email, country = 'US') => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account;
  } catch (error) {
    console.error('Create connected account error:', error);
    throw new Error('Failed to create connected account');
  }
};

// Create account link for onboarding
export const createAccountLink = async (accountId, returnUrl, refreshUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
    return accountLink;
  } catch (error) {
    console.error('Create account link error:', error);
    throw new Error('Failed to create account link');
  }
};

// Refund a payment
export const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    });
    return refund;
  } catch (error) {
    console.error('Create refund error:', error);
    throw new Error('Failed to create refund');
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};
