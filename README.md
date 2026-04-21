# Notification Orchestrator

> **Centralized Multi-Channel Notification Management Service**

A production-ready notification orchestration system with frontend dashboard, backend API, and MongoDB database integration.

## 📋 Project Information
- **Student**: Ritesh Sharma
- **Roll No**: 240410700085
- **Year & Section**: 4 Sem
- **Project Type**: Application Development (Full Stack)

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
- 🧪 **Testing Ready**: Jest configuration included

---

## 🏗️ System Architecture

```
┌─────────────────┐
│  Web Dashboard  │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │
│   (Express.js)  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│MongoDB │ │  Redis   │
└────────┘ └──────────┘
    │
    ▼
┌─────────────────────────────────┐
│   Orchestration Engine          │
│  ┌──────────────────────────┐  │
│  │ Preference Service       │  │
│  │ Template Service         │  │
│  │ Ingestion Service        │  │
│  └──────────────────────────┘  │
└────────┬────────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌────────┐ ┌─────┐ ┌──────┐ ┌────────┐
│ Email  │ │ SMS │ │ Push │ │ In-App │
│Adapter │ │Adapt│ │Adapt │ │Adapter │
└────────┘ └─────┘ └──────┘ └────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Val
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
