const express = require('express');
const router = express.Router();
const { eventSchema } = require('../../utils/validation');
const ingestionService = require('../../services/ingestion.service');
const logger = require('../../config/logger');

/**
 * POST /notifications/events
 * Ingest notification event
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = eventSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // Ingest event
    const result = await ingestionService.ingestEvent(value);

    res.status(202).json({
      message: 'Event accepted',
      ...result
    });

  } catch (error) {
    logger.error('Event ingestion failed:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
