const express = require('express');
const User = require('../../models/User');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../../config/logger');

const router = express.Router();

/**
 * GET /api/users
 * Get all users (for admin/notification sending)
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 100, skip = 0, search } = req.query;

    const query = { isActive: true };
    
    // Add search filter if provided
    if (search) {
      // Check if search looks like an ObjectId
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
      
      if (isObjectId) {
        // Search by _id if it looks like an ObjectId
        query._id = search;
      } else {
        // Search by username, email, fullName, or user_id field
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { user_id: { $regex: search, $options: 'i' } }
        ];
      }
    }

    const users = await User.find(query)
      .select('_id username email fullName role createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
});

/**
 * GET /api/users/:userId
 * Get user by ID or username
 */
router.get('/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    let user = null;
    
    // Check if it looks like an ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      // Try to find by ID
      user = await User.findById(userId).select('-password');
    }
    
    // If not found or not an ObjectId, try by username
    if (!user) {
      user = await User.findOne({ username: userId }).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({ user });

  } catch (error) {
    logger.error('Error fetching user:', error);
    next(error);
  }
});

module.exports = router;
