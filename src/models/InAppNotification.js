const mongoose = require('mongoose');

const inAppNotificationSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
});

// Index for efficient queries
inAppNotificationSchema.index({ user_id: 1, created_at: -1 });
inAppNotificationSchema.index({ user_id: 1, read: 1 });

// Auto-delete expired notifications
inAppNotificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('InAppNotification', inAppNotificationSchema);
