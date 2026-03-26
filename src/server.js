const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./config/logger');
const redisClient = require('./config/redis');
const errorHandler = require('./api/middleware/errorHandler');
const ingestionService = require('./services/ingestion.service');

// Import routes
const eventsRouter = require('./api/routes/events');
const preferencesRouter = require('./api/routes/preferences');
const statusRouter = require('./api/routes/status');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/notifications/events', eventsRouter);
app.use('/api/users', preferencesRouter);
app.use('/api/notifications', statusRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Notification Orchestrator',
    version: '1.0.0',
    description: 'Centralized Multi-Channel Notification Management Service',
    author: 'Ritesh Sharma (240410700085)',
    endpoints: {
      health: 'GET /health',
      ingestEvent: 'POST /api/notifications/events',
      getPreferences: 'GET /api/users/:userId/preferences',
      updatePreferences: 'PUT /api/users/:userId/preferences',
      getStatus: 'GET /api/notifications/:id/status'
    }
  });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
async function startServer() {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('Redis connected successfully');

    // Start scheduled notification processor (every minute)
    setInterval(() => {
      ingestionService.processScheduledNotifications()
        .catch(err => logger.error('Scheduled processor error:', err));
    }, 60000);

    app.listen(PORT, () => {
      logger.info(`🚀 Notification Orchestrator running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});

startServer();

module.exports = app;
