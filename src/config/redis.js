const redis = require('redis');
require('dotenv').config();

console.log('[REDIS] Configuring Redis client...');
console.log('[REDIS] Host:', process.env.REDIS_HOST || 'localhost');
console.log('[REDIS] Port:', process.env.REDIS_PORT || 6379);
console.log('[REDIS] TLS:', process.env.REDIS_TLS === 'true');
console.log('[REDIS] Username:', process.env.REDIS_USERNAME || '(none)');
console.log('[REDIS] Password set:', !!process.env.REDIS_PASSWORD);

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    tls: process.env.REDIS_TLS === 'true',
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      console.warn(`[REDIS] Reconnect attempt #${retries}`);
      if (retries >= 3) {
        console.error('[REDIS] Max reconnect attempts reached, giving up');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 500, 2000);
    }
  },
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('[REDIS] ❌ Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[REDIS] ✅ Client connected');
});

redisClient.on('ready', () => {
  console.log('[REDIS] ✅ Client ready');
});

redisClient.on('reconnecting', () => {
  console.warn('[REDIS] ⚠️  Reconnecting...');
});

redisClient.on('end', () => {
  console.warn('[REDIS] Connection ended');
});

module.exports = redisClient;
