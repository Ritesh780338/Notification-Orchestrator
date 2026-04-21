const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  template_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'inapp'],
    required: true
  },
  event_type: {
    type: String,
    required: true
  },
  subject: String,
  body: {
    type: String,
    required: true
  },
  variables: [String],
  version: {
    type: Number,
    default: 1
  },
  active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

templateSchema.index({ event_type: 1, channel: 1, active: 1 });

module.exports = mongoose.model('Template', templateSchema);
