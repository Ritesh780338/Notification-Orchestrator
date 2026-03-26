const express = require('express');
const router = express.Router();
const ingestionService = require('../../services/ingestion.service');
const logger = require('../../config/logger');

/**
 * GET /notifications/:id/status
 * Get notification status and delivery logs
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const status = await ingestionService.getNotificationStatus(id);

    if (!status) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json(status);

  } catch (error) {
    logger.error('Error fetching notification status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
