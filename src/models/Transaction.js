import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  // Parties involved
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Transaction details
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true,
  },
  type: {
    type: String,
    enum: ['subscription', 'tip', 'content-purchase', 'refund'],
    required: true,
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  },
  // Stripe integration
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true,
  },
  stripeChargeId: {
    type: String,
    default: null,
  },
  stripeRefundId: {
    type: String,
    default: null,
  },
  // Platform fees
  platformFeeAmount: {
    type: Number,
    default: 0,
  },
  platformFeePercentage: {
    type: Number,
    default: 10, // 10% platform fee
  },
  netAmount: {
    type: Number, // Amount after platform fees
  },
  // Related entities
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    default: null,
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  // Metadata
  description: {
    type: String,
    maxLength: 500,
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
  // Payment method info
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet'],
      default: 'card',
    },
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
  },
  // Timestamps for different states
  completedAt: {
    type: Date,
    default: null,
  },
  failedAt: {
    type: Date,
    default: null,
  },
  refundedAt: {
    type: Date,
    default: null,
  },
  // Error handling
  errorMessage: {
    type: String,
    default: null,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for performance
TransactionSchema.index({ payer: 1, createdAt: -1 });
TransactionSchema.index({ payee: 1, createdAt: -1 });
TransactionSchema.index({ stripePaymentIntentId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ completedAt: -1 });

// Pre-save middleware to calculate net amount
TransactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('platformFeePercentage')) {
    this.platformFeeAmount = (this.amount * this.platformFeePercentage) / 100;
    this.netAmount = this.amount - this.platformFeeAmount;
  }
  next();
});

// Methods
TransactionSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

TransactionSchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.errorMessage = errorMessage;
  return this.save();
};

TransactionSchema.methods.markRefunded = function(stripeRefundId) {
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.stripeRefundId = stripeRefundId;
  return this.save();
};

// Static methods for analytics
TransactionSchema.statics.getTotalEarnings = function(userId, startDate, endDate) {
  const match = {
    payee: userId,
    status: 'completed',
  };
  
  if (startDate || endDate) {
    match.completedAt = {};
    if (startDate) match.completedAt.$gte = startDate;
    if (endDate) match.completedAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        netAmount: { $sum: '$netAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      }
    }
  ]);
};

TransactionSchema.statics.getEarningsByType = function(userId, startDate, endDate) {
  const match = {
    payee: userId,
    status: 'completed',
  };
  
  if (startDate || endDate) {
    match.completedAt = {};
    if (startDate) match.completedAt.$gte = startDate;
    if (endDate) match.completedAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        netAmount: { $sum: '$netAmount' },
        count: { $sum: 1 },
      }
    }
  ]);
};

// Virtual for formatted amount
TransactionSchema.virtual('formattedAmount').get(function() {
  return (this.amount / 100).toFixed(2); // Assuming amounts are stored in cents
});

// Ensure virtual fields are serialized
TransactionSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
