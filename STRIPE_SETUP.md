# OnlyFarms - Stripe Subscription Setup Guide

This guide will help you set up the complete Stripe subscription system for OnlyFarms.

## Prerequisites

1. **Stripe Account**: Create a free Stripe account at [stripe.com](https://stripe.com)
2. **Stripe CLI**: Already installed via Homebrew
3. **MongoDB**: Running locally or connection string ready
4. **Next.js App**: OnlyFarms application ready

## Setup Steps

### 1. Configure Stripe Keys

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your test keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Environment Variables

Create or update `.env.local` with your Stripe keys:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/onlyfarms

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Authenticate Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### 4. Start Webhook Forwarding

In a **separate terminal**, start the webhook listener:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Important**: Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`.

### 5. Start Your Development Server

```bash
npm run dev
```

## Testing the Subscription Flow

### 1. Create Creator Account

1. Register a new account or login
2. Go to your dashboard and switch to "Creator" role
3. Set up your profile with a subscription price (minimum $1.00)

### 2. Test Subscription with Test Cards

Use these Stripe test card numbers:

#### Successful Subscription
- **Card**: `4242424242424242`
- **Expiry**: `12/34` (any future date)
- **CVC**: `123` (any 3 digits)
- **ZIP**: `12345` (any valid ZIP)

#### Card Declined
- **Card**: `4000000000000002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

#### Insufficient Funds
- **Card**: `4000000000009995`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

More test cards: [Stripe Testing Guide](https://stripe.com/docs/testing#cards)

### 3. Test Flow Steps

1. **Visit Creator Profile**: Go to `/creator/[creatorId]`
2. **Click Subscribe**: Click the subscription button
3. **Enter Payment**: Use test card information
4. **Complete Payment**: Submit the form
5. **Verify Access**: Check that subscription status updates
6. **Check Webhook**: Monitor webhook terminal for events

## API Endpoints

- **Create Subscription**: `POST /api/subscriptions/create`
- **Creator Profile**: `GET /api/creators/[creatorId]`  
- **Stripe Webhooks**: `POST /api/webhooks/stripe`

## Webhook Events Handled

- `invoice.payment_succeeded` - Activates subscription
- `invoice.payment_failed` - Marks payment as failed
- `customer.subscription.created` - Sets up subscription relationship
- `customer.subscription.updated` - Handles status changes
- `customer.subscription.deleted` - Deactivates subscription
- `payment_intent.succeeded` - Updates transaction status
- `payment_intent.payment_failed` - Marks transaction as failed

## Database Models

### User Model Extensions
- `stripeCustomerId` - Stripe customer ID
- `stripeAccountId` - For creator payouts (future)
- `stripePriceId` - Stripe price ID for subscriptions
- `subscribers[]` - Array of subscribers with Stripe subscription IDs
- `subscribedTo[]` - Array of subscriptions with Stripe subscription IDs

### Transaction Model
- Tracks all payment transactions
- Links to Stripe payment intents
- Includes platform fee calculations
- Stores payment method details

## Troubleshooting

### Webhook Issues
- Ensure `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Restart Next.js server after updating environment variables
- Check webhook forwarding terminal for errors

### Payment Issues
- Verify Stripe keys are correct (test mode for development)
- Check browser console for client-side errors
- Monitor server logs for API errors

### Database Issues
- Ensure MongoDB is running
- Check database connection string
- Verify user has proper role (creator/fan)

## Security Notes

- Never use real credit cards in test mode
- Keep secret keys secure and out of version control
- Test mode transactions don't affect real money
- Use environment variables for all configuration

## Production Deployment

When ready for production:

1. **Switch to Live Mode**:
   - Get live API keys from Stripe Dashboard
   - Update environment variables
   
2. **Set Up Production Webhooks**:
   - Create webhook endpoint in Stripe Dashboard
   - Point to your production domain: `https://yourdomain.com/api/webhooks/stripe`
   - Select the events you want to listen to
   
3. **Security**:
   - Enable HTTPS
   - Implement proper error handling
   - Set up monitoring and logging

## Features Implemented

✅ **Creator Subscription Management**
- Set subscription prices
- Dynamic Stripe price creation
- Subscription status tracking

✅ **Fan Subscription Flow**
- Secure payment processing
- Stripe Elements integration
- Real-time subscription status

✅ **Content Access Control**
- Subscription-based content access
- Free vs. premium content differentiation
- Real-time access checking

✅ **Payment Processing**
- Secure webhook handling
- Transaction tracking
- Platform fee calculation (10%)

✅ **User Experience**
- Beautiful UI with DaisyUI
- Loading states and error handling
- Mobile-responsive design

## Next Steps

Consider implementing:
- Subscription cancellation
- Proration for plan changes
- Creator payout system
- Analytics dashboard
- Email notifications
- Subscription management page
