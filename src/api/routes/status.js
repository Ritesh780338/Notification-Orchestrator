const express = require('express');
const ingestionService = require('../../services/ingestion.service');
const Notification = require('../../models/Notification');
const DeliveryLog = require('../../models/DeliveryLog');
const logger = require('../../config/logger');

const router = express.Router();

/**
 * GET /api/notifications/:id/status
 * Get notification status by ID or event_id
 */
router.get('/:id/status', async (req, res, next) => {
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
    next(error);
  }
});

/**
 * GET /api/notifications/user/:userId
 * Get all notifications for a user
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, status } = req.query;

    const query = { user_id: userId };
    if (status) {
      query.status = status;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    next(error);
  }
});

/**
 * GET /api/notifications/recent
 * Get recent notifications (user-specific)
 */
router.get('/recent', async (req, res, next) => {
  try {
    const { limit = 10, user_id } = req.query;

    // Build query with user filter
    const query = {};
    if (user_id) {
      query.user_id = user_id;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      notifications,
      user_id: user_id || 'all'
    });

  } catch (error) {
    logger.error('Error fetching recent notifications:', error);
    next(error);
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics (user-specific)
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate, user_id } = req.query;
    
    // Build base query with user filter
    const query = {};
    
    // Filter by logged-in user if user_id provided
    if (user_id) {
      query.user_id = user_id;
    }
    
    // Add date filters
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    // Build delivery log query
    const deliveryQuery = {};
    if (user_id) {
      deliveryQuery.user_id = user_id;
    }
    if (startDate || endDate) {
      deliveryQuery.timestamp = {};
      if (startDate) deliveryQuery.timestamp.$gte = new Date(startDate);
      if (endDate) deliveryQuery.timestamp.$lte = new Date(endDate);
    }

    const [statusStats, channelStats, eventTypeStats, total] = await Promise.all([
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      DeliveryLog.aggregate([
        { $match: deliveryQuery },
        { $group: { _id: { channel: '$channel', status: '$status' }, count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$event_type', count: { $sum: 1 } } }
      ]),
      Notification.countDocuments(query)
    ]);

    res.json({
      total,
      user_id: user_id || 'all',
      by_status: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      by_channel: channelStats.reduce((acc, item) => {
        const key = `${item._id.channel}_${item._id.status}`;
        acc[key] = item.count;
        return acc;
      }, {}),
      by_event_type: eventTypeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });

  } catch (error) {
    logger.error('Error fetching stats:', error);
    next(error);
  }
});

module.exports = router;
