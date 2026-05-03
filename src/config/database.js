const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    // Ensure database name is present in URI
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    // If URI ends with / and has no db name, append one
    if (uri.endsWith('/') || uri.match(/\.net\/\?/)) {
      uri = uri.replace(/\/(\?.*)?$/, '/notification_orchestrator$1');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // Fail fast after 10s instead of hanging
      connectTimeoutMS: 10000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    throw error; // Let the caller handle it
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});

module.exports = connectDB;
