const redisClient = require('../config/redis');

/**
 * Check if user has exceeded rate limit
 */
async function checkRateLimit(userId, channel, maxPerHour = 5) {
  const key = `rate_limit:${userId}:${channel}`;
  const count = await redisClient.get(key);
  
  if (count && parseInt(count) >= maxPerHour) {
    return false; // Rate limit exceeded
  }
  
  return true; // Within limit
}

/**
 * Increment rate limit counter
 */
async function incrementRateLimit(userId, channel) {
  const key = `rate_limit:${userId}:${channel}`;
  const count = await redisClient.incr(key);
  
  if (count === 1) {
    // Set expiry for 1 hour on first increment
    await redisClient.expire(key, 3600);
  }
  
  return count;
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
