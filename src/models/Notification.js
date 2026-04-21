const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['user_signup', 'order_confirmation', 'password_reset', 'marketing', 'security_alert', 'system_notification']
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['received', 'queued', 'scheduled', 'processing', 'sent', 'delivered', 'failed', 'suppressed', 'retried'],
    default: 'received',
    index: true
  },
  channels: [{
    channel_type: {
      type: String,
      enum: ['email', 'sms', 'push', 'inapp']
    },
    status: String,
    sent_at: Date,
    delivered_at: Date,
    error_message: String,
    retry_count: { type: Number, default: 0 }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  template_id: String,
  rendered_content: {
    subject: String,
    body: String
  },
  schedule_time: Date,
  preferred_channels: [String],
  retry_count: {
    type: Number,
    default: 0
  },
  error_message: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  processed_at: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ status: 1, schedule_time: 1 });
notificationSchema.index({ event_type: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
