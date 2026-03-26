const express = require('express');
const router = express.Router();
const { preferencesUpdateSchema } = require('../../utils/validation');
const preferenceService = require('../../services/preference.service');
const logger = require('../../config/logger');

/**
 * GET /users/:userId/preferences
 * Get user notification preferences
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const preferences = await preferenceService.getUserPreferences(userId);

    res.json({
      user_id: userId,
      preferences
    });

  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /users/:userId/preferences
 * Update user notification preferences
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate request body
    const { error, value } = preferencesUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const preferences = await preferenceService.updateUserPreferences(
      userId,
      value.preferences
    );

    res.json({
      message: 'Preferences updated successfully',
      user_id: userId,
      preferences
    });

  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
