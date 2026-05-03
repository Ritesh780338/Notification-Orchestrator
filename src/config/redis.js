const redis = require('redis');
require('dotenv').config();

const isRedisCloud = process.env.REDIS_HOST && process.env.REDIS_HOST.includes('redislabs.com');

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    tls: process.env.REDIS_TLS === 'true',
    connectTimeout: 10000, // Fail fast after 10s
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        console.error('Redis: max reconnect attempts reached, giving up');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 500, 2000);
    }
  },
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

module.exports = redisClient;
