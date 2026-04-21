const express = require('express');
const ingestionService = require('../../services/ingestion.service.mongo');
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
 * GET /api/notifications/stats
 * Get notification statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};

    const [statusStats, channelStats, eventTypeStats, total] = await Promise.all([
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      DeliveryLog.aggregate([
        { $match: Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {} },
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
