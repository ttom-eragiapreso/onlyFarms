import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxLength: 1000,
  },
  type: {
    type: String,
    enum: ['text', 'media', 'tip'],
    default: 'text',
  },
  // For media messages
  mediaUrl: {
    type: String,
    default: null,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio'],
    default: null,
  },
  // For tip messages
  tipAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Message status
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Reply functionality
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for performance
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, isRead: 1 });
MessageSchema.index({ createdAt: -1 });

// Virtual for conversation ID (sorted user IDs)
MessageSchema.virtual('conversationId').get(function() {
  const ids = [this.sender.toString(), this.recipient.toString()].sort();
  return ids.join('_');
});

// Method to mark as read
MessageSchema.methods.markAsRead = function(userId) {
  if (this.recipient.toString() === userId.toString() && !this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to delete for user
MessageSchema.methods.deleteForUser = function(userId) {
  const existingDelete = this.deletedBy.find(del => 
    del.user.toString() === userId.toString()
  );
  
  if (!existingDelete) {
    this.deletedBy.push({ user: userId });
    
    // If both users have deleted, mark as deleted
    if (this.deletedBy.length >= 2) {
      this.isDeleted = true;
    }
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to get conversation between two users
MessageSchema.statics.getConversation = function(user1Id, user2Id, limit = 50, page = 1) {
  const skip = (page - 1) * limit;
  
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ],
    deletedBy: { $not: { $elemMatch: { user: user1Id } } }
  })
  .populate('sender', 'name image')
  .populate('recipient', 'name image')
  .populate('replyTo', 'content sender')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get unread count for user
MessageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    deletedBy: { $not: { $elemMatch: { user: userId } } }
  });
};

// Ensure virtual fields are serialized
MessageSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
