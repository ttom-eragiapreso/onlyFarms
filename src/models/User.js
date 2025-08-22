import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    select: false, // Don't include password by default
  },
  image: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['fan', 'creator'],
    default: 'fan',
  },
  provider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials',
  },
  // Creator-specific fields
  bio: {
    type: String,
    maxLength: 500,
    default: '',
  },
  coverImage: {
    type: String,
    default: null,
  },
  subscriptionPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Subscription management
  subscribers: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      subscribedAt: {
        type: Date,
        default: Date.now,
      },
      subscriptionEndDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      stripeSubscriptionId: {
        type: String,
        default: null,
      },
    }],
    default: [],
  },
  subscribedTo: {
    type: [{
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      subscribedAt: {
        type: Date,
        default: Date.now,
      },
      subscriptionEndDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      stripeSubscriptionId: {
        type: String,
        default: null,
      },
    }],
    default: [],
  },
  // Following other creators (simple follow, not subscription)
  following: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    default: [],
  },
  // Financial tracking
  totalEarnings: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  // Stripe integration
  stripeCustomerId: {
    type: String,
    default: null,
  },
  stripeAccountId: {
    type: String,
    default: null,
  },
  stripePriceId: {
    type: String,
    default: null,
  },
  // Settings
  isProfilePublic: {
    type: Boolean,
    default: true,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance (email index is automatic from unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscribers.user': 1 });
UserSchema.index({ 'subscribedTo.creator': 1 });

// Virtual for subscriber count
UserSchema.virtual('subscriberCount').get(function() {
  return (this.subscribers || []).filter(sub => sub.isActive).length;
});

// Virtual for subscription count
UserSchema.virtual('subscriptionCount').get(function() {
  return (this.subscribedTo || []).filter(sub => sub.isActive).length;
});

// Method to check if user is subscribed to a creator
UserSchema.methods.isSubscribedTo = function(creatorId) {
  return (this.subscribedTo || []).some(sub => 
    sub.creator.toString() === creatorId.toString() && 
    sub.isActive && 
    sub.subscriptionEndDate > new Date()
  );
};

// Method to add subscription
UserSchema.methods.subscribe = function(creatorId, duration = 30) {
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + duration);
  
  if (!Array.isArray(this.subscribedTo)) {
    this.subscribedTo = [];
  }
  
  this.subscribedTo.push({
    creator: creatorId,
    subscriptionEndDate,
    isActive: true,
  });
  
  return this.save();
};

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
