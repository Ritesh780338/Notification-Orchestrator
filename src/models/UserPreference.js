const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'inapp'],
    required: true
  },
  category: {
    type: String,
    enum: ['marketing', 'transactional', 'security', 'system'],
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
});

const userPreferenceSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: String,
  phone: String,
  push_token: String,
  preferences: [preferenceSchema],
  global_opt_out: {
    type: Boolean,
    default: false
  },
  suppressed: {
    type: Boolean,
    default: false
  },
  quiet_hours: {
    enabled: { type: Boolean, default: false },
    start_hour: { type: Number, min: 0, max: 23 },
    end_hour: { type: Number, min: 0, max: 23 },
    timezone: { type: String, default: 'UTC' }
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

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
