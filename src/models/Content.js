import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200,
  },
  description: {
    type: String,
    maxLength: 1000,
    default: '',
  },
  type: {
    type: String,
    enum: ['photo', 'video', 'text'],
    required: true,
  },
  // Media files
  mediaUrls: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video'],
    },
    thumbnail: String, // For videos
    duration: Number, // For videos in seconds
    size: Number, // File size in bytes
  }],
  // Access control
  accessType: {
    type: String,
    enum: ['free', 'subscription', 'pay-per-view'],
    default: 'free',
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Engagement metrics
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    likedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
      maxLength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  }],
  // Pay-per-view purchases
  purchases: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    amount: Number,
    stripePaymentId: String,
  }],
  // Content status
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  // Analytics
  viewCount: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  // Tags and categories
  tags: [String],
  category: {
    type: String,
    default: 'general',
  },
}, {
  timestamps: true,
});

// Indexes for performance
ContentSchema.index({ creator: 1, createdAt: -1 });
ContentSchema.index({ accessType: 1 });
ContentSchema.index({ isPublished: 1, publishedAt: -1 });
ContentSchema.index({ 'likes.user': 1 });
ContentSchema.index({ tags: 1 });

// Virtual for like count
ContentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
ContentSchema.virtual('commentCount').get(function() {
  return this.comments.filter(comment => !comment.isHidden).length;
});

// Virtual for purchase count
ContentSchema.virtual('purchaseCount').get(function() {
  return this.purchases.length;
});

// Method to check if user has access to content
ContentSchema.methods.hasAccess = function(user) {
  if (!user) return this.accessType === 'free';
  
  // Creator always has access to their own content
  if (this.creator.toString() === user._id.toString()) return true;
  
  switch (this.accessType) {
    case 'free':
      return true;
    case 'subscription':
      return user.isSubscribedTo(this.creator);
    case 'pay-per-view':
      return this.purchases.some(purchase => 
        purchase.user.toString() === user._id.toString()
      );
    default:
      return false;
  }
};

// Method to add like
ContentSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );
  
  if (!existingLike) {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Method to remove like
ContentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => 
    like.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to add comment
ContentSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content,
  });
  
  return this.save();
};

// Pre-save middleware to set publishedAt
ContentSchema.pre('save', function(next) {
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Ensure virtual fields are serialized
ContentSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);
