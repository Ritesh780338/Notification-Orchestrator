# Notification Orchestrator

A centralized multi-channel notification management service that handles Email, SMS, Push, and In-App notifications with intelligent routing, user preferences, scheduling, and comprehensive tracking.

## 📋 Project Information
- **Student**: Ritesh Sharma
- **Roll No**: 240410700085
- **Year & Section**: 4 Sem
- **Project Type**: Application Development

## ✨ Features

- 📧 Multi-channel notification delivery (Email, SMS, Push, In-App)
- ⚙️ User preference management with opt-in/opt-out controls
- 📝 Template engine with variable substitution
- ⏰ Scheduling and throttling capabilities
- 🔄 Retry mechanism with exponential backoff
- 📊 Comprehensive delivery tracking and status monitoring
- 🚀 RESTful API for event ingestion and status queries
- 🔒 Rate limiting and quiet hours support
- 📈 Structured logging and observability

## 🏗️ Architecture Components

1. API Gateway
2. Notification Ingestion Service
3. Orchestration Engine
4. Template Engine
5. Preference Service
6. Channel Adapters (Email/SMS/Push/In-App)
7. Delivery Tracker
8. Dead Letter Queue
9. Analytics & Monitoring Layer

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Email**: Nodemailer (SMTP)
- **SMS**: Mock (Twilio/AWS SNS ready)
- **Push**: Mock (FCM/APNs ready)
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- PostgreSQL v12+
- Redis v6+

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database and email credentials

# 3. Create database
createdb notification_orchestrator

# 4. Run migrations
npm run migrate

# 5. Start Redis
redis-server

# 6. Start the application
npm run dev
```

The server will start on `http://localhost:3000`

## 📚 Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed installation and configuration
- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Architecture](docs/ARCHITECTURE.md) - System design and architecture
- [Project Structure](project-structure.md) - Code organization

## 🔌 API Endpoints

### Event Ingestion
```bash
POST /api/notifications/events
```

### User Preferences
```bash
GET /api/users/{userId}/preferences
PUT /api/users/{userId}/preferences
```

### Notification Status
```bash
GET /api/notifications/{id}/status
```

### Health Check
```bash
GET /health
```

## 📝 Example Usage

### Send a Notification
```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_signup",
    "user_id": "your-user-id",
    "priority": "normal",
    "metadata": {
      "first_name": "John"
    }
  }'
```

### Check Status
```bash
curl http://localhost:3000/api/notifications/evt_xxxxx/status
```

### Update Preferences
```bash
curl -X PUT http://localhost:3000/api/users/your-user-id/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "channel": "email",
        "category": "marketing",
        "enabled": false
      }
    ]
  }'
```

## 🎯 Success Metrics

- ≥ 99.9% event ingestion success rate
- ≥ 99% delivery attempt reliability
- < 2 sec median processing latency
- < 0.1% duplicate notifications
- 100% preference compliance

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📁 Project Structure

```
notification-orchestrator/
├── src/
│   ├── adapters/          # Channel adapters
│   ├── api/               # API routes and middleware
│   ├── config/            # Configuration files
│   ├── database/          # Schema and migrations
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── server.js          # Main entry point
├── docs/                  # Documentation
├── tests/                 # Test files
├── logs/                  # Application logs
└── package.json
```

## 🔐 Security Features

- JWT/OAuth2 authentication ready
- Rate limiting (100 req/min)
- Input validation with Joi
- SQL injection protection
- CORS configuration
- Security headers (Helmet)
- Encryption support

## 🚀 Future Enhancements

- AI-driven channel optimization
- Smart send-time optimization
- A/B testing framework
- Campaign management UI
- Multi-language template auto-translation
- Customer analytics dashboard
- WebSocket for real-time in-app notifications

## 📄 License

MIT

## 👨‍💻 Author

Ritesh Sharma (Roll No: 240410700085)

---

**Note**: This is a college project demonstrating a production-ready notification orchestration system. SMS and Push adapters use mock implementations for demonstration purposes.

---

## 📖 Complete Documentation

This project includes comprehensive documentation:

- **[INDEX.md](INDEX.md)** - Complete index of all files and documentation
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Comprehensive project summary
- **[DELIVERABLES.md](DELIVERABLES.md)** - Complete deliverables checklist
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference card
- **[DEMO_GUIDE.md](DEMO_GUIDE.md)** - Step-by-step demo guide
- **[DIRECTORY_STRUCTURE.txt](DIRECTORY_STRUCTURE.txt)** - Visual directory tree

**Start here:** [INDEX.md](INDEX.md) for complete navigation guide.
