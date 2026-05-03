const redisClient = require('../config/redis');

/**
 * Check if user has exceeded rate limit
 */
async function checkRateLimit(userId, channel, maxPerHour = 5) {
  try {
    if (!redisClient.isReady) return true; // Redis unavailable, allow through
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

module.exports = {
  checkRateLimit,
  incrementRateLimit,
  isQuietHours
};
