const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema({
  notification_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true,
    index: true
  },
  event_id: {
    type: String,
    required: true,
    index: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'inapp'],
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'],
    required: true
  },
  provider_response: mongoose.Schema.Types.Mixed,
  error_message: String,
  retry_attempt: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

deliveryLogSchema.index({ event_id: 1, timestamp: -1 });
deliveryLogSchema.index({ channel: 1, status: 1, timestamp: -1 });

module.exports = mongoose.model('DeliveryLog', deliveryLogSchema);
