'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = (() => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey || publishableKey === 'pk_test_your-stripe-public-key') {
    console.warn('Stripe publishable key not configured properly. Stripe functionality will be disabled.');
    return null;
  }
  return loadStripe(publishableKey);
})();

const CheckoutForm = ({ creator, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');

  useEffect(() => {
    createSubscription();
  }, []);

  const createSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: creator._id,
          priceAmount: creator.subscriptionPrice,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);
    } catch (error) {
      console.error('Error creating subscription:', error);
      onError?.(error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const card = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card,
            billing_details: {
              name: session?.user?.name || 'Anonymous',
              email: session?.user?.email,
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#6B7280',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Subscription Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900">Monthly Subscription</h4>
            <p className="text-sm text-purple-700">Access to {creator.name}'s exclusive content</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-900">
              ${creator.subscriptionPrice.toFixed(2)}
            </div>
            <div className="text-sm text-purple-600">per month</div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Payment Method
        </label>
        <div className="border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500">
          Your payment information is encrypted and secure. You can cancel your subscription at any time.
        </p>
      </div>

      {/* Billing Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subscription</span>
          <span className="font-medium">${creator.subscriptionPrice.toFixed(2)}/month</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Platform fee (10%)</span>
          <span className="font-medium">${(creator.subscriptionPrice * 0.1).toFixed(2)}</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between font-semibold">
          <span>Total today</span>
          <span>${creator.subscriptionPrice.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Billing will recur monthly unless cancelled
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!stripe || isProcessing || !clientSecret}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            `Subscribe for $${creator.subscriptionPrice.toFixed(2)}/month`
          )}
        </button>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By subscribing, you agree to our Terms of Service and Privacy Policy. 
        You will be charged ${creator.subscriptionPrice.toFixed(2)} monthly until cancelled.
      </p>
    </form>
  );
};

const SubscriptionModal = ({ creator, onSuccess, onClose }) => {
  const [error, setError] = useState('');

  const handleSuccess = (paymentIntent) => {
    console.log('Subscription successful:', paymentIntent);
    onSuccess?.(paymentIntent);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={creator.image || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`}
                alt={creator.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Subscribe to {creator.name}</h2>
                <p className="text-sm text-gray-600">Get exclusive access to their content</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Payment Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Elements stripe={stripePromise}>
            <CheckoutForm
              creator={creator}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
