import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  // Recipient
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Sender (optional, for user-generated notifications)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Notification content
  title: {
    type: String,
    required: true,
    maxLength: 100,
  },
  message: {
    type: String,
    required: true,
    maxLength: 500,
  },
  // Notification type
  type: {
    type: String,
    enum: [
      'subscription', 
      'new_content', 
      'tip_received', 
      'tip_sent', 
      'message', 
      'content_purchase', 
      'payment_success', 
      'payment_failed',
      'system',
      'like',
      'comment'
    ],
    required: true,
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  // Status
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  // Related entities
  relatedContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    default: null,
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
  },
  relatedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  // Action data (for frontend navigation)
  actionUrl: {
    type: String,
    default: null,
  },
  actionText: {
    type: String,
    default: null,
  },
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Display settings
  icon: {
    type: String,
    default: 'bell',
  },
  color: {
    type: String,
    default: 'blue',
  },
  // Delivery settings
  isEmailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
    default: null,
  },
  isPushSent: {
    type: Boolean,
    default: false,
  },
  pushSentAt: {
    type: Date,
    default: null,
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for performance
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ isDeleted: 1 });

// Methods
NotificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

NotificationSchema.methods.markAsDeleted = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static methods
NotificationSchema.statics.createSubscriptionNotification = function(creatorId, subscriberId) {
  return this.create({
    user: creatorId,
    sender: subscriberId,
    title: 'New Subscriber!',
    message: 'You have a new subscriber to your content.',
    type: 'subscription',
    priority: 'high',
    icon: 'user-plus',
    color: 'green',
    actionUrl: '/dashboard/subscribers',
    actionText: 'View Subscribers'
  });
};

NotificationSchema.statics.createTipNotification = function(creatorId, fanId, amount) {
  return this.create({
    user: creatorId,
    sender: fanId,
    title: 'Tip Received!',
    message: `You received a $${amount} tip!`,
    type: 'tip_received',
    priority: 'high',
    icon: 'dollar-sign',
    color: 'green',
    actionUrl: '/dashboard/earnings',
    actionText: 'View Earnings'
  });
};

NotificationSchema.statics.createContentPurchaseNotification = function(creatorId, buyerId, contentTitle) {
  return this.create({
    user: creatorId,
    sender: buyerId,
    title: 'Content Purchased!',
    message: `Someone purchased your content "${contentTitle}".`,
    type: 'content_purchase',
    priority: 'medium',
    icon: 'shopping-cart',
    color: 'blue',
    actionUrl: '/dashboard/content',
    actionText: 'View Content'
  });
};

NotificationSchema.statics.createNewContentNotification = function(subscriberId, creatorId, contentTitle) {
  return this.create({
    user: subscriberId,
    sender: creatorId,
    title: 'New Content Available!',
    message: `${contentTitle} - Check out the latest content from your subscribed creator.`,
    type: 'new_content',
    priority: 'medium',
    icon: 'image',
    color: 'purple',
    actionUrl: '/feed',
    actionText: 'View Content'
  });
};

NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    isDeleted: false
  });
};

NotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false, isDeleted: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Pre-save middleware to set default values based on type
NotificationSchema.pre('save', function(next) {
  if (this.isNew) {
    switch (this.type) {
      case 'tip_received':
        this.icon = this.icon || 'dollar-sign';
        this.color = this.color || 'green';
        break;
      case 'subscription':
        this.icon = this.icon || 'user-plus';
        this.color = this.color || 'blue';
        break;
      case 'new_content':
        this.icon = this.icon || 'image';
        this.color = this.color || 'purple';
        break;
      case 'message':
        this.icon = this.icon || 'message-circle';
        this.color = this.color || 'blue';
        break;
      case 'like':
        this.icon = this.icon || 'heart';
        this.color = this.color || 'red';
        break;
      case 'comment':
        this.icon = this.icon || 'message-square';
        this.color = this.color || 'gray';
        break;
    }
  }
  next();
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
