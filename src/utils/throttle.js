const redisClient = require('../config/redis');

/**
 * Check if user has exceeded rate limit
 */
async function checkRateLimit(userId, channel, maxPerHour = null) {
  try {
    if (!redisClient.isReady) return true; // Redis unavailable, allow through
    
    // Get max per hour from environment or use defaults per channel
    if (!maxPerHour) {
      const channelLimits = {
        email: parseInt(process.env.RATE_LIMIT_EMAIL_PER_HOUR || 10),
        sms: parseInt(process.env.RATE_LIMIT_SMS_PER_HOUR || 5),
        push: parseInt(process.env.RATE_LIMIT_PUSH_PER_HOUR || 20),
        inapp: parseInt(process.env.RATE_LIMIT_INAPP_PER_HOUR || 50) // Higher limit for in-app
      };
      maxPerHour = channelLimits[channel] || 10;
    }
    
    const key = `rate_limit:${userId}:${channel}`;
    const count = await redisClient.get(key);
    
    if (count && parseInt(count) >= maxPerHour) {
      return false; // Rate limit exceeded
    }
    
    return true; // Within limit
  } catch (err) {
    console.warn('Rate limit check failed (Redis unavailable), allowing request:', err.message);
    return true;
  }
}

/**
 * Increment rate limit counter
 */
async function incrementRateLimit(userId, channel) {
  try {
    if (!redisClient.isReady) return 0; // Redis unavailable, skip
    const key = `rate_limit:${userId}:${channel}`;
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      // Set expiry for 1 hour on first increment
      await redisClient.expire(key, 3600);
    }
    
    return count;
  } catch (err) {
    console.warn('Rate limit increment failed (Redis unavailable):', err.message);
    return 0;
  }
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours() {
  const now = new Date();
  const hour = now.getHours();
  
  const quietStart = parseInt(process.env.QUIET_HOURS_START || 22);
  const quietEnd = parseInt(process.env.QUIET_HOURS_END || 7);
  
  if (quietStart > quietEnd) {
    // Quiet hours span midnight (e.g., 22:00 to 07:00)
    return hour >= quietStart || hour < quietEnd;
  } else {
    // Quiet hours within same day
    return hour >= quietStart && hour < quietEnd;
  }
}

/**
 * Reset rate limit for a user and channel
 */
async function resetRateLimit(userId, channel) {
  try {
    if (!redisClient.isReady) return false;
    const key = `rate_limit:${userId}:${channel}`;
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.warn('Rate limit reset failed:', err.message);
    return false;
  }
}

/**
 * Get current rate limit count
 */
async function getRateLimitCount(userId, channel) {
  try {
    if (!redisClient.isReady) return 0;
    const key = `rate_limit:${userId}:${channel}`;
    const count = await redisClient.get(key);
    return parseInt(count) || 0;
  } catch (err) {
    console.warn('Get rate limit count failed:', err.message);
    return 0;
  }
}

module.exports = {
  checkRateLimit,
  incrementRateLimit,
  isQuietHours,
  resetRateLimit,
  getRateLimitCount
};
