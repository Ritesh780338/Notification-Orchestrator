const express = require('express');
const Joi = require('joi');
const preferenceService = require('../../services/preference.service.mongo');
const logger = require('../../config/logger');

const router = express.Router();

// Validation schema
const preferenceUpdateSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  push_token: Joi.string().optional(),
  preferences: Joi.array().items(
    Joi.object({
      channel: Joi.string().valid('email', 'sms', 'push', 'inapp').required(),
      category: Joi.string().valid('marketing', 'transactional', 'security', 'system').required(),
      enabled: Joi.boolean().required()
    })
  ).optional(),
  global_opt_out: Joi.boolean().optional(),
  quiet_hours: Joi.object({
    enabled: Joi.boolean(),
    start_hour: Joi.number().min(0).max(23),
    end_hour: Joi.number().min(0).max(23),
    timezone: Joi.string()
  }).optional()
});

/**
 * GET /api/users/:userId/preferences
 * Get user notification preferences
 */
router.get('/:userId/preferences', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const preferences = await preferenceService.getUserPreferences(userId);
    
    res.json(preferences);

  } catch (error) {
    logger.error('Error fetching preferences:', error);
    next(error);
  }
});

/**
 * PUT /api/users/:userId/preferences
 * Update user notification preferences
 */
router.put('/:userId/preferences', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Validate request body
    const { error, value } = preferenceUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const updated = await preferenceService.updateUserPreferences(userId, value);
    
    logger.info('Preferences updated', { userId });
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: updated
    });

  } catch (error) {
    logger.error('Error updating preferences:', error);
    next(error);
  }
});

module.exports = router;
