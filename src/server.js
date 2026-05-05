// ============================================================
// STARTUP: log immediately so Render shows output right away
// ============================================================
console.log('[STARTUP] server.js loaded, Node:', process.version);
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] PORT:', process.env.PORT);
console.log('[STARTUP] MONGODB_URI set:', !!process.env.MONGODB_URI);
console.log('[STARTUP] REDIS_HOST:', process.env.REDIS_HOST);
console.log('[STARTUP] REDIS_PORT:', process.env.REDIS_PORT);

const express = require('express');
console.log('[STARTUP] express loaded');

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
console.log('[STARTUP] core modules loaded');

const connectDB = require('./config/database');
console.log('[STARTUP] database module loaded');

const logger = require('./config/logger');
console.log('[STARTUP] logger module loaded');

const redisClient = require('./config/redis');
console.log('[STARTUP] redis module loaded');

const errorHandler = require('./api/middleware/errorHandler');
const ingestionService = require('./services/ingestion.service');
console.log('[STARTUP] services loaded');

// Import routes
console.log('[STARTUP] loading routes...');
const authRouter = require('./api/routes/auth');
console.log('[STARTUP] auth route loaded');
const eventsRouter = require('./api/routes/events');
console.log('[STARTUP] events route loaded');
const usersRouter = require('./api/routes/users');
console.log('[STARTUP] users route loaded');
const preferencesRouter = require('./api/routes/preferences');
console.log('[STARTUP] preferences route loaded');
const statusRouter = require('./api/routes/status');
console.log('[STARTUP] status route loaded');
const templatesRouter = require('./api/routes/templates');
console.log('[STARTUP] templates route loaded');
const testRouter = require('./api/routes/test');
console.log('[STARTUP] test route loaded');
const inappRouter = require('./api/routes/inapp');
console.log('[STARTUP] inapp route loaded');

const app = express();
const PORT = process.env.PORT || 0;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

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
    uptime: process.uptime(),
    database: 'MongoDB'
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/notifications/events', eventsRouter);
app.use('/api/users', usersRouter);
app.use('/api/users', preferencesRouter);
app.use('/api/notifications', statusRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/test', testRouter);
app.use('/api/inapp', inappRouter);

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Notification Orchestrator',
    version: '1.0.0',
    description: 'Centralized Multi-Channel Notification Management Service',
    author: 'Ritesh Sharma (240410700085)',
    database: 'MongoDB',
    endpoints: {
      health: 'GET /health',
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      logout: 'POST /api/auth/logout',
      getUsers: 'GET /api/users',
      getUser: 'GET /api/users/:userId',
      ingestEvent: 'POST /api/notifications/events',
      getPreferences: 'GET /api/users/:userId/preferences',
      updatePreferences: 'PUT /api/users/:userId/preferences',
      getStatus: 'GET /api/notifications/:id/status',
      getTemplates: 'GET /api/templates',
      createTemplate: 'POST /api/templates'
    }
  });
});

// Serve login page for unauthenticated users
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
async function startServer() {
  console.log('[STARTUP] startServer() called');

  // --- MongoDB ---
  console.log('[STARTUP] Connecting to MongoDB...');
  try {
    await connectDB();
    console.log('[STARTUP] ✅ MongoDB connected');
  } catch (dbError) {
    console.error('[STARTUP] ❌ MongoDB connection FAILED:', dbError.message);
    console.error('[STARTUP] Full error:', dbError);
    process.exit(1);
  }

  // --- Redis ---
  console.log('[STARTUP] Connecting to Redis...');
  try {
    await redisClient.connect();
    console.log('[STARTUP] ✅ Redis connected');
    logger.info('Redis connected successfully');
  } catch (redisError) {
    console.warn('[STARTUP] ⚠️  Redis connection failed (non-fatal):', redisError.message);
    logger.warn('Redis connection failed, continuing without Redis:', redisError.message);
  }

  // --- Templates ---
  console.log('[STARTUP] Initializing default templates...');
  try {
    await initializeTemplates();
    console.log('[STARTUP] ✅ Templates initialized');
  } catch (tplError) {
    console.warn('[STARTUP] ⚠️  Template init failed (non-fatal):', tplError.message);
  }

  // --- Scheduled processor ---
  setInterval(() => {
    ingestionService.processScheduledNotifications()
      .catch(err => logger.error('Scheduled processor error:', err));
  }, 60000);

  // --- Listen ---
  app.listen(PORT, () => {
    console.log(`[STARTUP] ✅ Server listening on port ${PORT}`);
    logger.info(`🚀 Notification Orchestrator running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Frontend: http://localhost:${PORT}`);
    logger.info(`🔗 API: http://localhost:${PORT}/api`);
    logger.info(`💾 Database: MongoDB`);
  });
}

// ============================================================
// TEMPLATE INITIALIZER
// ============================================================
async function initializeTemplates() {
  const Template = require('./models/Template');
  const templateService = require('./services/template.service');

  const defaultTemplates = [
    {
      template_id: 'tpl_user_signup_email',
      name: 'User Signup Email',
      channel: 'email',
      event_type: 'user_signup',
      subject: 'Welcome to Notification Orchestrator, {{first_name}}!',
      body: 'Hi {{first_name}},\n\nWelcome to our platform! We\'re excited to have you on board.\n\nBest regards,\nThe Team',
      variables: ['first_name']
    },
    {
      template_id: 'tpl_user_signup_sms',
      name: 'User Signup SMS',
      channel: 'sms',
      event_type: 'user_signup',
      body: 'Welcome {{first_name}}! Thanks for signing up.',
      variables: ['first_name']
    },
    {
      template_id: 'tpl_order_confirmation_email',
      name: 'Order Confirmation Email',
      channel: 'email',
      event_type: 'order_confirmation',
      subject: 'Order Confirmation #{{order_id}}',
      body: 'Hi {{first_name}},\n\nYour order #{{order_id}} has been confirmed!\n\nTotal: ${{amount}}\n\nThank you for your purchase!',
      variables: ['first_name', 'order_id', 'amount']
    },
    {
      template_id: 'tpl_password_reset_email',
      name: 'Password Reset Email',
      channel: 'email',
      event_type: 'password_reset',
      subject: 'Password Reset Request',
      body: 'Hi {{first_name}},\n\nWe received a request to reset your password.\n\nReset Code: {{reset_code}}\n\nIf you didn\'t request this, please ignore this email.',
      variables: ['first_name', 'reset_code']
    },
    {
      template_id: 'tpl_security_alert_email',
      name: 'Security Alert Email',
      channel: 'email',
      event_type: 'security_alert',
      subject: 'Security Alert: {{alert_type}}',
      body: 'Hi {{first_name}},\n\nWe detected unusual activity on your account.\n\nAlert: {{alert_type}}\nTime: {{timestamp}}\n\nIf this wasn\'t you, please secure your account immediately.',
      variables: ['first_name', 'alert_type', 'timestamp']
    }
  ];

  const count = await Template.countDocuments();
  if (count === 0) {
    for (const template of defaultTemplates) {
      await templateService.saveTemplate(template);
    }
    logger.info('Default templates initialized');
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
process.on('SIGTERM', async () => {
  console.log('[SHUTDOWN] SIGTERM received');
  if (redisClient.isReady) await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[SHUTDOWN] SIGINT received');
  if (redisClient.isReady) await redisClient.quit();
  process.exit(0);
});

// Catch any unhandled errors so they show in logs
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise);
  console.error('[FATAL] Reason:', reason);
  process.exit(1);
});

startServer();

module.exports = app;
