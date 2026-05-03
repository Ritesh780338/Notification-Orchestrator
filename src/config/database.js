const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Append db name if URI ends with / and has no db name after the host
  if (/\.net\/?$/.test(uri) || uri.endsWith('/')) {
    uri = uri.replace(/\/?$/, '/notification_orchestrator');
    console.log('[DB] Appended database name to URI');
  }

  console.log('[DB] Connecting to MongoDB (host hidden for security)...');

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  logger.info(`MongoDB Connected: ${conn.connection.host}`);
  console.log(`[DB] ✅ Connected to: ${conn.connection.host}`);
  return conn;
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] ⚠️  MongoDB disconnected');
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] ❌ MongoDB error:', err.message);
  logger.error('MongoDB error:', err);
});

module.exports = connectDB;
