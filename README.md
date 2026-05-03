# Notification Orchestrator

> **Centralized Multi-Channel Notification Management Service**

A production-ready notification orchestration system with a modern web dashboard, RESTful API, and MongoDB database.

## 📋 Project Information
- **Student**: Ritesh Sharma
- **Roll No**: 240410700085
- **Year & Section**: 4 Sem
- **Project Type**: Full Stack Application

---

## ✨ Features

### Core Functionality
- 📧 **Multi-Channel Delivery**: Email, SMS, Push, and In-App notifications
- 🎯 **Intelligent Routing**: Smart channel selection based on user preferences
- ⚙️ **Preference Management**: Complete user opt-in/opt-out controls
- 📝 **Template Engine**: Dynamic templates with variable substitution
- ⏰ **Scheduling**: Send notifications immediately or schedule for later
- 🔄 **Retry Logic**: Exponential backoff with configurable attempts
- 📊 **Real-time Tracking**: Complete delivery lifecycle monitoring
- 🚦 **Rate Limiting**: Per-user, per-channel throttling
- 🌙 **Quiet Hours**: Respect user sleep schedules
- 📈 **Analytics Dashboard**: Visual statistics and performance metrics

### Technical Features
- 🎨 **Modern Frontend**: Responsive web dashboard with real-time updates
- 🔌 **RESTful API**: Complete API for all operations
- 💾 **MongoDB Database**: Scalable NoSQL data storage
- ⚡ **Redis Caching**: Fast rate limiting and session management
- 🔒 **Security**: Rate limiting, input validation, CORS, Helmet
- 📝 **Logging**: Structured logging with Winston

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Edit .env file with your MongoDB and Redis credentials

# 3. Start the application
npm start

# 4. Open browser
# Navigate to: http://localhost:3000
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Validation**: Joi
- **Logging**: Winston

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript**: Vanilla JS (no framework dependencies)
- **UI**: Custom components with Font Awesome icons

---

## 📡 API Endpoints

### Send Notification
```bash
POST /api/notifications/events
Content-Type: application/json

{
  "event_type": "user_signup",
  "user_id": "user_123",
  "priority": "normal",
  "metadata": {
    "first_name": "John"
  }
}
```

### Check Status
```bash
GET /api/notifications/{event_id}/status
```

### Get User Preferences
```bash
GET /api/users/{user_id}/preferences
```

### Update Preferences
```bash
PUT /api/users/{user_id}/preferences
Content-Type: application/json

{
  "email": "user@example.com",
  "preferences": [
    {
      "channel": "email",
      "category": "marketing",
      "enabled": false
    }
  ]
}
```

### Get Templates
```bash
GET /api/templates
```

### Create Template
```bash
POST /api/templates
Content-Type: application/json

{
  "template_id": "tpl_custom",
  "name": "Custom Template",
  "channel": "email",
  "event_type": "custom_event",
  "subject": "Hello {{name}}",
  "body": "This is a custom template",
  "variables": ["name"]
}
```

### Get Statistics
```bash
GET /api/notifications/stats
```

---

## 🎯 How It Works

1. **Event Ingestion**: Application sends notification event via API
2. **User Lookup**: System retrieves user preferences (creates default if not exists)
3. **Template Selection**: Finds appropriate template for event type and channel
4. **Preference Check**: Validates user opt-in/opt-out settings
5. **Quiet Hours**: Respects user's quiet hours configuration
6. **Rate Limiting**: Applies per-user, per-channel throttling
7. **Orchestration**: Routes to appropriate channel adapters
8. **Delivery**: Sends via Email, SMS, Push, or In-App
9. **Tracking**: Logs delivery status and updates notification record
10. **Retry**: Automatically retries failed deliveries with exponential backoff

---

## 📁 Project Structure

```
notification-orchestrator/
├── public/                      # Frontend files
│   ├── index.html              # Main dashboard
│   ├── css/styles.css          # Styling
│   └── js/app.js               # Frontend logic
├── src/
│   ├── adapters/               # Channel adapters
│   │   ├── email.adapter.js
│   │   ├── sms.adapter.js
│   │   ├── push.adapter.js
│   │   └── inapp.adapter.js
│   ├── api/
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── routes/             # API routes
│   │       ├── events.js
│   │       ├── preferences.js
│   │       ├── status.js
│   │       └── templates.js
│   ├── config/                 # Configuration
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── redis.js
│   ├── models/                 # MongoDB models
│   │   ├── Notification.js
│   │   ├── UserPreference.js
│   │   ├── Template.js
│   │   └── DeliveryLog.js
│   ├── services/               # Business logic
│   │   ├── ingestion.service.js
│   │   ├── orchestration.service.js
│   │   ├── preference.service.js
│   │   └── template.service.js
│   ├── utils/                  # Utilities
│   │   ├── retry.js
│   │   ├── throttle.js
│   │   └── validation.js
│   └── server.js               # Main entry point
├── logs/                       # Application logs
├── .env                        # Environment variables
└── package.json               # Dependencies
```

---

## 🎨 Frontend Features

The web dashboard provides:

1. **Dashboard Tab**: Real-time statistics and charts
   - Total notifications count
   - Delivered, pending, and failed counts
   - Event type distribution chart
   - Channel performance visualization

2. **Send Notification Tab**: Create and send notifications
   - User ID input
   - Event type selection
   - Priority levels
   - Channel selection
   - Metadata (JSON)
   - Schedule time (optional)

3. **User Preferences Tab**: Manage user notification settings
   - Load existing preferences
   - Update contact information
   - Configure channel preferences by category
   - Set quiet hours
   - Global opt-out option

4. **Templates Tab**: View and create notification templates
   - List all templates
   - Create new templates
   - Support for all channels
   - Variable substitution

5. **Check Status Tab**: Track notification delivery
   - Search by event ID or notification ID
   - View detailed status
   - Channel-wise delivery information

---

## 🔐 Security Features

- JWT/OAuth2 authentication ready
- Rate limiting (100 req/min)
- Input validation with Joi
- CORS configuration
- Security headers (Helmet)
- Environment variable protection

---

## 📊 Success Metrics

- ≥ 99.9% event ingestion success rate
- ≥ 99% delivery attempt reliability
- < 2 sec median processing latency
- < 0.1% duplicate notifications
- 100% preference compliance

---

## 🚀 Deployment

### Environment Variables

Required variables in `.env`:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
```

### Production Deployment

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Start with PM2 (recommended)
pm2 start src/server.js --name notification-orchestrator

# Or use npm
npm start
```

---

## 🧪 Testing

The application is fully functional and can be tested via:

1. **Web Dashboard**: http://localhost:3000
2. **API Endpoints**: Use curl, Postman, or any HTTP client
3. **Health Check**: http://localhost:3000/health

### Example Test Flow

1. Open http://localhost:3000
2. Go to "Send Notification" tab
3. Fill in:
   - User ID: `test_user_001`
   - Event Type: `user_signup`
   - Metadata: `{"first_name": "John"}`
4. Click "Send Notification"
5. Copy the Event ID from the response
6. Go to "Check Status" tab
7. Paste the Event ID and click "Check"
8. View the notification status and delivery details

---

## 📄 License

MIT

## 👨‍💻 Author

Ritesh Sharma (Roll No: 240410700085)

---

## 🎓 Project Highlights

This project demonstrates:
- ✅ Full-stack development (Frontend + Backend + Database)
- ✅ RESTful API design and implementation
- ✅ MongoDB database modeling and operations
- ✅ Redis caching and rate limiting
- ✅ Real-time data visualization
- ✅ User preference management
- ✅ Template engine with variable substitution
- ✅ Professional UI/UX design
- ✅ Production-ready code structure
- ✅ Comprehensive error handling
- ✅ Logging and monitoring

---

**The application is now running at http://localhost:3000** 🎉
