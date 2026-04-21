const express = require('express');
const Joi = require('joi');
const ingestionService = require('../../services/ingestion.service.mongo');
const logger = require('../../config/logger');

const router = express.Router();

// Validation schema
const eventSchema = Joi.object({
  event_type: Joi.string().valid(
    'user_signup',
    'order_confirmation',
    'password_reset',
    'marketing',
    'security_alert',
    'system_notification'
  ).required(),
  user_id: Joi.string().required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  metadata: Joi.object().default({}),
  preferred_channels: Joi.array().items(
    Joi.string().valid('email', 'sms', 'push', 'inapp')
  ).optional(),
  schedule_time: Joi.date().iso().optional()
});

/**
 * POST /api/notifications/events
 * Ingest a new notification event
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = eventSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Ingest event
    const result = await ingestionService.ingestEvent(value);

    logger.info('Event accepted', { event_id: result.event_id });

    res.status(202).json({
      message: 'Event accepted for processing',
      ...result
    });

  } catch (error) {
    logger.error('Error ingesting event:', error);
    next(error);
  }
});

module.exports = router;
