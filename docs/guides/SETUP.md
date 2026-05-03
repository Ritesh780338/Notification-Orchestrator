# Notification Orchestrator - Complete Setup Instructions

## Student Information
- **Name**: Ritesh Sharma
- **Roll No**: 240410700085
- **Year & Section**: 4 Sem
- **Project**: Notification Orchestrator - Centralized Multi-Channel Notification Management Service

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Testing the Application](#testing-the-application)
7. [Project Structure](#project-structure)
8. [API Documentation](#api-documentation)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **MongoDB** (v5.0 or higher)
   - **Option A - Local Installation**:
     - Windows: https://www.mongodb.com/try/download/community
     - Mac: `brew install mongodb-community`
     - Linux: Follow official MongoDB docs
   - **Option B - MongoDB Atlas (Cloud)**:
     - Create free account at: https://www.mongodb.com/cloud/atlas
     - Create a cluster and get connection string

3. **Redis** (v6.0 or higher)
   - Windows: https://github.com/microsoftarchive/redis/releases
   - Mac: `brew install redis`
   - Linux: `sudo apt-get install redis-server`
   - Verify: `redis-cli ping` (should return "PONG")

4. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/

---

## 📦 Installation

### Step 1: Clone or Extract the Project
```bash
# If using Git
git clone <repository-url>
cd notification-orchestrator

# Or extract the ZIP file and navigate to the folder
cd notification-orchestrator
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages including:
- Express.js (Web framework)
- Mongoose (MongoDB ODM)
- Redis (Caching)
- Winston (Logging)
- Joi (Validation)
- And more...

---

## 🗄️ Database Setup

### Option 1: Local MongoDB

1. **Start MongoDB Service**
   ```bash
   # Windows
   net start MongoDB

   # Mac/Linux
   brew services start mongodb-community
   # or
   sudo systemctl start mongod
   ```

2. **Verify MongoDB is Running**
   ```bash
   mongosh
   # Should connect successfully
   ```

3. **The database will be created automatically** when you first run the application

### Option 2: MongoDB Atlas (Cloud)

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
3. Update `.env` file with your connection string

### Start Redis

```bash
# Windows
redis-server

# Mac/Linux
brew services start redis
# or
sudo systemctl start redis
```

---

## ⚙️ Configuration

### Step 1: Environment Variables

The `.env` file is already created. Update these values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/notification_orchestrator
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification_orchestrator

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (Optional - for testing email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@notificationorchestrator.com
```

### Step 2: Seed Sample Data

Run this command to populate the database with sample users and templates:

```bash
npm run seed
```

This creates:
- 2 sample users (user_001, user_002)
- 10 notification templates
- Default user preferences

---

## 🚀 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Expected Output
```
🚀 Notification Orchestrator running on port 3000
📝 Environment: development
🔗 Frontend: http://localhost:3000
🔗 API: http://localhost:3000/api
💾 Database: MongoDB
```

---

## 🧪 Testing the Application

### 1. Access the Frontend Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the Notification Orchestrator dashboard with 5 tabs:
- Dashboard (Statistics)
- Send Notification
- User Preferences
- Templates
- Check Status

### 2. Send a Test Notification

1. Click on **"Send Notification"** tab
2. Fill in the form:
   - **User ID**: `user_001`
   - **Event Type**: `user_signup`
   - **Priority**: `normal`
   - **Metadata**: 
     ```json
     {"first_name": "John"}
     ```
   - **Channels**: Check "Email"
3. Click **"Send Notification"**
4. You should see a success message with an Event ID

### 3. Check Notification Status

1. Click on **"Check Status"** tab
2. Enter the Event ID from the previous step
3. Click **"Check"**
4. You should see the notification details and delivery status

### 4. Manage User Preferences

1. Click on **"User Preferences"** tab
2. Enter User ID: `user_001`
3. Click **"Load"**
4. Modify preferences and click **"Save Preferences"**

### 5. View Templates

1. Click on **"Templates"** tab
2. You should see all available notification templates
3. Click **"Create New Template"** to add custom templates

---

## 📁 Project Structure

```
notification-orchestrator/
├── public/                      # Frontend files
│   ├── index.html              # Main HTML file
│   ├── css/
│   │   └── styles.css          # Styling
│   └── js/
│       └── app.js              # Frontend JavaScript
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
│   │       ├── events.mongo.js
│   │       ├── preferences.mongo.js
│   │       ├── status.mongo.js
│   │       └── templates.mongo.js
│   ├── config/                 # Configuration
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── redis.js
│   ├── database/
│   │   └── seed.js             # Database seeding
│   ├── models/                 # MongoDB models
│   │   ├── Notification.js
│   │   ├── UserPreference.js
│   │   ├── Template.js
│   │   └── DeliveryLog.js
│   ├── services/               # Business logic
│   │   ├── ingestion.service.mongo.js
│   │   ├── orchestration.service.mongo.js
│   │   ├── preference.service.mongo.js
│   │   └── template.service.mongo.js
│   ├── utils/                  # Utility functions
│   │   ├── retry.js
│   │   ├── throttle.js
│   │   └── validation.js
│   └── server-mongo.js         # Main server file
├── .env                        # Environment variables
├── .env.example               # Example environment file
├── package.json               # Dependencies
└── README.md                  # Project documentation
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Send Notification
```http
POST /api/notifications/events
Content-Type: application/json

{
  "event_type": "user_signup",
  "user_id": "user_001",
  "priority": "normal",
  "metadata": {
    "first_name": "John"
  },
  "preferred_channels": ["email", "sms"]
}
```

#### 2. Get Notification Status
```http
GET /api/notifications/{event_id}/status
```

#### 3. Get User Preferences
```http
GET /api/users/{user_id}/preferences
```

#### 4. Update User Preferences
```http
PUT /api/users/{user_id}/preferences
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+1234567890",
  "preferences": [
    {
      "channel": "email",
      "category": "marketing",
      "enabled": false
    }
  ]
}
```

#### 5. Get All Templates
```http
GET /api/templates
```

#### 6. Create Template
```http
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

#### 7. Get Statistics
```http
GET /api/notifications/stats
```

---

## 🔍 Troubleshooting

### MongoDB Connection Issues

**Problem**: Cannot connect to MongoDB
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**:
1. Ensure MongoDB is running: `mongosh`
2. Check if MongoDB service is started
3. Verify MONGODB_URI in `.env` file

### Redis Connection Issues

**Problem**: Redis connection failed
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**:
1. Start Redis: `redis-server`
2. Test connection: `redis-cli ping`
3. Check REDIS_HOST and REDIS_PORT in `.env`

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**:
1. Change PORT in `.env` file to another port (e.g., 3001)
2. Or kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -ti:3000 | xargs kill -9
   ```

### Module Not Found Errors

**Problem**: Cannot find module 'xyz'

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Testing Checklist

- [ ] MongoDB is running
- [ ] Redis is running
- [ ] Dependencies installed (`npm install`)
- [ ] Database seeded (`npm run seed`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Frontend loads at http://localhost:3000
- [ ] Can send a test notification
- [ ] Can check notification status
- [ ] Can view and update user preferences
- [ ] Can view templates
- [ ] Dashboard shows statistics

---

## 📞 Support

If you encounter any issues:

1. Check the logs in `logs/` directory
2. Verify all prerequisites are installed
3. Ensure MongoDB and Redis are running
4. Check `.env` configuration
5. Review the troubleshooting section

---

## 🎓 Project Submission

This project demonstrates:
- ✅ Full-stack application (Frontend + Backend)
- ✅ MongoDB database integration
- ✅ RESTful API design
- ✅ Multi-channel notification system
- ✅ User preference management
- ✅ Template engine
- ✅ Real-time status tracking
- ✅ Professional UI/UX
- ✅ Comprehensive documentation

**Student**: Ritesh Sharma (240410700085)
**Project**: Notification Orchestrator
**Year**: 4 Sem

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB (if local)
mongod

# 3. Start Redis
redis-server

# 4. Seed database
npm run seed

# 5. Start application
npm run dev

# 6. Open browser
# Navigate to: http://localhost:3000
```

---

**Congratulations! Your Notification Orchestrator is now ready to use! 🎉**
