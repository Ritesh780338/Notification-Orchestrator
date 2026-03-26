const Joi = require('joi');

const eventSchema = Joi.object({
  event_type: Joi.string().required(),
  user_id: Joi.string().uuid().required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
  metadata: Joi.object().default({}),
  preferred_channels: Joi.array().items(
    Joi.string().valid('email', 'sms', 'push', 'in_app')
  ).optional(),
  schedule_time: Joi.date().iso().optional()
});

const preferenceSchema = Joi.object({
  channel: Joi.string().valid('email', 'sms', 'push', 'in_app').required(),
  category: Joi.string().valid('marketing', 'transactional', 'security', 'system_alerts').required(),
  enabled: Joi.boolean().required()
});

const preferencesUpdateSchema = Joi.object({
  preferences: Joi.array().items(preferenceSchema).min(1).required()
});

module.exports = {
  eventSchema,
  preferenceSchema,
  preferencesUpdateSchema
};
