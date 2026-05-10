/**
 * Reset Rate Limits Script
 * Use this to clear rate limits for testing
 */

require('dotenv').config();
const redisClient = require('./src/config/redis');

async function resetRateLimits() {
  console.log('\n🔄 Resetting Rate Limits...\n');

  try {
    // Connect to Redis
    console.log('⏳ Connecting to Redis...');
    await redisClient.connect();
    
    console.log('✅ Connected to Redis\n');

    // Find all rate limit keys
    const keys = await redisClient.keys('rate_limit:*');
    
    if (keys.length === 0) {
      console.log('✅ No rate limits found. All clear!');
    } else {
      console.log(`Found ${keys.length} rate limit entries:\n`);
      
      for (const key of keys) {
        const count = await redisClient.get(key);
        console.log(`  - ${key}: ${count} requests`);
      }
      
      console.log('\n🗑️  Deleting all rate limit entries...');
      await redisClient.del(keys);
      console.log(`✅ Deleted ${keys.length} rate limit entries`);
    }

    console.log('\n✨ Rate limits reset successfully!\n');
    
    // Close Redis connection
    await redisClient.quit();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error resetting rate limits:', error);
    try {
      await redisClient.quit();
    } catch (e) {
      // Ignore quit errors
    }
    process.exit(1);
  }
}

// Run the script
resetRateLimits();
