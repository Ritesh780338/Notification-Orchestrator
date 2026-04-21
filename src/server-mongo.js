const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./config/logger');
const redisClient = require('./config/redis');
const errorHandler = require('./api/middleware/errorHandler');
const ingestionService = require('./services/ingestion.service.mongo');

// Import routes
const eventsRouter = require('./api/routes/events.mongo');
const preferencesRouter = require('./api/routes/preferences.mongo');
const statusRouter = require('./api/routes/status.mongo');
const templatesRouter = require('./api/routes/templates.mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
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
app.use('/api/notifications/events', eventsRouter);
app.use('/api/users', preferencesRouter);
app.use('/api/notifications', statusRouter);
app.use('/api/templates', templatesRouter);

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
      ingestEvent: 'POST /api/notifications/events',
      getPreferences: 'GET /api/users/:userId/preferences',
      updatePreferences: 'PUT /api/users/:userId/preferences',
      getStatus: 'GET /api/notifications/:id/status',
      getTemplates: 'GET /api/templates',
      createTemplate: 'POST /api/templates'
    }
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await redisClient.connect();
    logger.info('Redis connected successfully');

    // Initialize default templates
    await initializeTemplates();

    // Start scheduled notification processor (every minute)
    setInterval(() => {
      ingestionService.processScheduledNotifications()
        .catch(err => logger.error('Scheduled processor error:', err));
    }, 60000);

    app.listen(PORT, () => {
      logger.info(`🚀 Notification Orchestrator running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend: http://localhost:${PORT}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`💾 Database: MongoDB`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function initializeTemplates() {
  const Template = require('./models/Template');
  const templateService = require('./services/template.service.mongo');
  
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

  try {
    const count = await Template.countDocuments();
    if (count === 0) {
      for (const template of defaultTemplates) {
        await templateService.saveTemplate(template);
      }
      logger.info('Default templates initialized');
    }
  } catch (error) {
    logger.error('Error initializing templates:', error);
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
