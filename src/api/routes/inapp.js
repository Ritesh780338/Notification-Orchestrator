const express = require('express');
const router = express.Router();
const inappAdapter = require('../../adapters/inapp.adapter');
const logger = require('../../config/logger');

/**
 * GET /api/inapp/notifications
 * Get in-app notifications for current user
 */
router.get('/notifications', async (req, res, next) => {
  try {
    const userId = req.query.user_id || req.user?.user_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const options = {
      limit: parseInt(req.query.limit) || 50,
      skip: parseInt(req.query.skip) || 0,
      unreadOnly: req.query.unread_only === 'true'
    };

    const result = await inappAdapter.getNotifications(userId, options);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      total: result.total
    });

  } catch (error) {
    logger.error('Error fetching in-app notifications:', error);
    next(error);
  }
});

/**
 * GET /api/inapp/unread-count
 * Get unread notification count for user
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.query.user_id || req.user?.user_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await inappAdapter.getUnreadCount(userId);

    res.json({ count: result.count });

  } catch (error) {
    logger.error('Error getting unread count:', error);
    next(error);
  }
});

/**
 * PUT /api/inapp/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.body.user_id || req.user?.user_id;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await inappAdapter.markAsRead(notificationId, userId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      message: 'Notification marked as read',
      notification: result.notification
    });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    next(error);
  }
});

/**
 * PUT /api/inapp/notifications/read-all
 * Mark all notifications as read
 */
router.put('/notifications/read-all', async (req, res, next) => {
  try {
    const userId = req.body.user_id || req.user?.user_id;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await inappAdapter.markAllAsRead(userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      message: 'All notifications marked as read',
      count: result.count
    });

  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    next(error);
  }
});

/**
 * DELETE /api/inapp/notifications/:id
 * Delete notification
 */
router.delete('/notifications/:id', async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.query.user_id || req.user?.user_id;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await inappAdapter.deleteNotification(notificationId, userId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({ message: 'Notification deleted' });

  } catch (error) {
    logger.error('Error deleting notification:', error);
    next(error);
  }
});

module.exports = router;
