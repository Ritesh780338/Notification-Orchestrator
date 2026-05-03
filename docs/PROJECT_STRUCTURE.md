# Project Structure - Notification Orchestrator

Complete overview of the project's folder structure and file organization.

---

## 📁 Directory Tree

```
notification-orchestrator/
├── 📄 README.md                          # Main project documentation
├── 📄 package.json                       # Node.js dependencies and scripts
├── 📄 package-lock.json                  # Locked dependency versions
├── 📄 .gitignore                         # Git ignore rules
├── 📄 .env                               # Environment variables (not in git)
├── 📄 .env.example                       # Example environment variables
│
├── 📂 docs/                              # Documentation
│   ├── 📄 PROJECT_STRUCTURE.md           # This file
│   ├── 📄 SYSTEM_STATUS.md               # Current system status
│   │
│   ├── 📂 api/                           # API Documentation
│   │   └── 📄 API_REFERENCE.md           # Complete API reference
│   │
│   └── 📂 guides/                        # User Guides
│       ├── 📄 SETUP.md                   # Setup instructions
│       ├── 📄 DEPLOYMENT.md              # Deployment guide
│       ├── 📄 QUICK_DEPLOY.md            # Quick deployment
│       └── 📄 TESTING.md                 # Testing guide (if exists)
│
├── 📂 public/                            # Frontend files (served statically)
│   ├── 📄 index.html                     # Main dashboard HTML
│   │
│   ├── 📂 css/                           # Stylesheets
│   │   └── 📄 styles.css                 # Main stylesheet
│   │
│   └── 📂 js/                            # Frontend JavaScript
│       └── 📄 app.js                     # Dashboard logic
│
├── 📂 src/                               # Backend source code
│   ├── 📄 server.js                      # Main server entry point
│   │
│   ├── 📂 api/                           # API layer
│   │   ├── 📂 middleware/                # Express middleware
│   │   │   └── 📄 errorHandler.js        # Global error handler
│   │   │
│   │   └── 📂 routes/                    # API route handlers
│   │       ├── 📄 events.js              # Notification events
│   │       ├── 📄 preferences.js         # User preferences
│   │       ├── 📄 status.js              # Status checking
│   │       └── 📄 templates.js           # Template management
│   │
│   ├── 📂 adapters/                      # Channel adapters
│   │   ├── 📄 email.adapter.js           # Email delivery
│   │   ├── 📄 sms.adapter.js             # SMS delivery
│   │   ├── 📄 push.adapter.js            # Push notifications
│   │   └── 📄 inapp.adapter.js           # In-app notifications
│   │
│   ├── 📂 config/                        # Configuration
│   │   ├── 📄 database.js                # MongoDB connection
│   │   ├── 📄 logger.js                  # Winston logger setup
│   │   └── 📄 redis.js                   # Redis connection
│   │
│   ├── 📂 models/                        # MongoDB models (Mongoose)
│   │   ├── 📄 Notification.js            # Notification schema
│   │   ├── 📄 UserPreference.js          # User preferences schema
│   │   ├── 📄 Template.js                # Template schema
│   │   └── 📄 DeliveryLog.js             # Delivery log schema
│   │
│   ├── 📂 services/                      # Business logic
│   │   ├── 📄 ingestion.service.js       # Event ingestion
│   │   ├── 📄 orchestration.service.js   # Notification orchestration
│   │   ├── 📄 preference.service.js      # Preference management
│   │   └── 📄 template.service.js        # Template management
│   │
│   └── 📂 utils/                         # Utility functions
│       ├── 📄 retry.js                   # Retry logic
│       ├── 📄 throttle.js                # Rate limiting
│       └── 📄 validation.js              # Input validation
│
└── 📂 logs/                              # Application logs
    ├── 📄 combined.log                   # All logs
    └── 📄 error.log                      # Error logs only
```

---

## 📋 File Descriptions

### Root Level

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation and overview |
| `package.json` | Node.js project configuration and dependencies |
| `.env` | Environment variables (not committed to git) |
| `.env.example` | Template for environment variables |
| `.gitignore` | Files and folders to ignore in git |

### Documentation (`docs/`)

| File/Folder | Purpose |
|-------------|---------|
| `PROJECT_STRUCTURE.md` | This file - project organization |
| `SYSTEM_STATUS.md` | Current system status and health |
| `api/API_REFERENCE.md` | Complete API documentation |
| `guides/SETUP.md` | Installation and setup instructions |
| `guides/DEPLOYMENT.md` | Deployment guide for various platforms |
| `guides/QUICK_DEPLOY.md` | Quick 10-minute deployment guide |

### Frontend (`public/`)

| File | Purpose |
|------|---------|
| `index.html` | Main dashboard with 5 tabs (Dashboard, Send, Preferences, Templates, Status) |
| `css/styles.css` | All styling for the dashboard |
| `js/app.js` | Frontend JavaScript (API calls, UI logic, charts) |

### Backend (`src/`)

#### Main Server
| File | Purpose |
|------|---------|
| `server.js` | Express server setup, middleware, routes, startup logic |

#### API Layer (`src/api/`)
| File | Purpose |
|------|---------|
| `middleware/errorHandler.js` | Global error handling middleware |
| `routes/events.js` | POST /api/notifications/events - Send notifications |
| `routes/preferences.js` | GET/PUT /api/users/:userId/preferences |
| `routes/status.js` | GET /api/notifications/:id/status, GET /api/notifications/stats |
| `routes/templates.js` | CRUD operations for templates |

#### Channel Adapters (`src/adapters/`)
| File | Purpose |
|------|---------|
| `email.adapter.js` | Send emails via SMTP (Nodemailer) |
| `sms.adapter.js` | Send SMS (mock implementation) |
| `push.adapter.js` | Send push notifications (mock implementation) |
| `inapp.adapter.js` | Send in-app notifications (mock implementation) |

#### Configuration (`src/config/`)
| File | Purpose |
|------|---------|
| `database.js` | MongoDB connection using Mongoose |
| `logger.js` | Winston logger configuration |
| `redis.js` | Redis client setup for caching and rate limiting |

#### Data Models (`src/models/`)
| File | Purpose |
|------|---------|
| `Notification.js` | Notification document schema |
| `UserPreference.js` | User preferences and contact info |
| `Template.js` | Notification templates |
| `DeliveryLog.js` | Delivery attempt logs |

#### Business Logic (`src/services/`)
| File | Purpose |
|------|---------|
| `ingestion.service.js` | Event ingestion, validation, notification creation |
| `orchestration.service.js` | Channel routing, delivery orchestration |
| `preference.service.js` | User preference management |
| `template.service.js` | Template CRUD and rendering |

#### Utilities (`src/utils/`)
| File | Purpose |
|------|---------|
| `retry.js` | Exponential backoff retry logic |
| `throttle.js` | Rate limiting utilities |
| `validation.js` | Input validation helpers |

---

## 🔄 Data Flow

```
1. Frontend (public/index.html)
   ↓
2. API Routes (src/api/routes/*.js)
   ↓
3. Services (src/services/*.js)
   ↓
4. Models (src/models/*.js) ←→ MongoDB
   ↓
5. Adapters (src/adapters/*.js)
   ↓
6. External Services (Email, SMS, Push)
```

---

## 🗄️ Database Collections

### MongoDB Collections

1. **notifications**
   - Stores all notification events
   - Fields: event_id, user_id, event_type, status, channels, metadata

2. **userpreferences**
   - User notification preferences
   - Fields: user_id, email, phone, preferences, quiet_hours

3. **templates**
   - Notification templates
   - Fields: template_id, channel, event_type, subject, body, variables

4. **deliverylogs**
   - Delivery attempt logs
   - Fields: notification_id, channel, status, timestamp, error

### Redis Keys

- `rate_limit:{user_id}:{channel}` - Rate limiting counters
- `notification:{event_id}` - Cached notification data

---

## 📦 Dependencies

### Production Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `redis` | Redis client |
| `joi` | Input validation |
| `winston` | Logging |
| `nodemailer` | Email sending |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT tokens |
| `cors` | CORS middleware |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `uuid` | UUID generation |
| `dotenv` | Environment variables |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `nodemon` | Auto-restart on changes |
| `jest` | Testing framework |
| `supertest` | API testing |

---

## 🚀 Scripts

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest --coverage"
}
```

---

## 🔐 Environment Variables

See `.env.example` for all required environment variables:

- **Server**: PORT, NODE_ENV
- **Database**: MONGODB_URI
- **Redis**: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- **JWT**: JWT_SECRET, JWT_EXPIRY
- **Email**: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- **Rate Limiting**: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS

---

## 📝 Naming Conventions

### Files
- **Routes**: `{resource}.js` (e.g., `events.js`)
- **Services**: `{resource}.service.js` (e.g., `ingestion.service.js`)
- **Models**: `{ModelName}.js` (PascalCase, e.g., `Notification.js`)
- **Adapters**: `{channel}.adapter.js` (e.g., `email.adapter.js`)

### Code
- **Variables**: camelCase (e.g., `userId`, `eventType`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Classes**: PascalCase (e.g., `NotificationService`)
- **Functions**: camelCase (e.g., `sendNotification`)

---

## 🔍 Key Features by Location

### Frontend Features (`public/`)
- Dashboard with real-time statistics
- Send notification form
- User preference management
- Template viewer and creator
- Status checker

### Backend Features (`src/`)
- RESTful API endpoints
- Multi-channel notification delivery
- User preference management
- Template engine with variable substitution
- Rate limiting and throttling
- Retry logic with exponential backoff
- Quiet hours support
- Scheduled notifications

---

## 📊 Metrics & Monitoring

### Logs (`logs/`)
- `combined.log` - All application logs
- `error.log` - Error logs only

### Monitoring Endpoints
- `GET /health` - Health check
- `GET /api/notifications/stats` - Statistics

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment-specific configuration |
| `package.json` | Project metadata and dependencies |
| `.gitignore` | Git ignore patterns |

---

## 📚 Documentation Organization

```
docs/
├── PROJECT_STRUCTURE.md    ← You are here
├── SYSTEM_STATUS.md         ← Current system status
├── api/
│   └── API_REFERENCE.md     ← Complete API docs
└── guides/
    ├── SETUP.md             ← Setup instructions
    ├── DEPLOYMENT.md        ← Deployment guide
    └── QUICK_DEPLOY.md      ← Quick start
```

---

## 🎯 Best Practices

1. **Code Organization**: Follow the established folder structure
2. **Naming**: Use consistent naming conventions
3. **Documentation**: Update docs when adding features
4. **Environment**: Never commit `.env` file
5. **Logging**: Use Winston logger, not console.log
6. **Error Handling**: Use the global error handler
7. **Validation**: Validate all inputs with Joi
8. **Testing**: Write tests for new features

---

**Project**: Notification Orchestrator  
**Author**: Ritesh Sharma (240410700085)  
**Last Updated**: May 3, 2026
