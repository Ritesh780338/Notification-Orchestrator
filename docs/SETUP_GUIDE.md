# Notification Orchestrator - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up PostgreSQL Database

```bash
# Create database
createdb notification_orchestrator

# Or using psql
psql -U postgres
CREATE DATABASE notification_orchestrator;
\q
```

### 3. Set Up Redis

```bash
# Start Redis (if not running)
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:latest
```

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Configuration:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notification_orchestrator
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (for testing, use Gmail with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 5. Run Database Migrations

```bash
npm run migrate
```

This will:
- Create all required tables
- Set up indexes
- Insert sample templates
- Create a test user

### 6. Start the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

---

## Verification

### 1. Check Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 10
}
```

### 2. Test Event Ingestion

First, get the test user ID from database:
```bash
psql -U postgres -d notification_orchestrator -c "SELECT id FROM users WHERE email = 'test@example.com';"
```

Then send a test notification:
```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_signup",
    "user_id": "YOUR_USER_ID_HERE",
    "priority": "normal",
    "metadata": {
      "first_name": "Test User"
    }
  }'
```

### 3. Check Notification Status

Use the `event_id` from the previous response:
```bash
curl http://localhost:3000/api/notifications/evt_xxxxx/status
```

---

## Testing Email Delivery

### Using Gmail

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `.env` file

### Using Mailtrap (Recommended for Development)

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials from your inbox
3. Update `.env`:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
```

---

## Project Structure

```
notification-orchestrator/
├── src/
│   ├── adapters/          # Channel adapters (email, sms, push, in-app)
│   ├── api/
│   │   ├── middleware/    # Express middleware
│   │   └── routes/        # API routes
│   ├── config/            # Configuration files
│   ├── database/          # Database schema and migrations
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── server.js          # Main application entry
├── docs/                  # Documentation
├── logs/                  # Application logs
├── tests/                 # Test files
├── .env                   # Environment variables
├── .env.example           # Example environment file
└── package.json           # Dependencies
```

---

## Common Issues

### Database Connection Error

**Error:** `Connection refused to localhost:5432`

**Solution:**
- Ensure PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Verify database exists: `psql -l`

### Redis Connection Error

**Error:** `Redis Client Error: connect ECONNREFUSED`

**Solution:**
- Start Redis: `redis-server`
- Check Redis is running: `redis-cli ping` (should return PONG)
- Verify Redis port in `.env`

### Email Sending Fails

**Error:** `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solution:**
- Use App Password instead of regular password
- Enable "Less secure app access" (not recommended)
- Use Mailtrap for development

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

---

## Development Tips

### View Logs

```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log
```

### Database Queries

```bash
# Connect to database
psql -U postgres -d notification_orchestrator

# View notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

# View delivery logs
SELECT * FROM delivery_logs ORDER BY created_at DESC LIMIT 10;

# Check user preferences
SELECT * FROM user_preferences WHERE user_id = 'your-user-id';
```

### Redis Commands

```bash
# Connect to Redis
redis-cli

# View rate limits
KEYS rate_limit:*

# Check specific rate limit
GET rate_limit:user-id:email
```

---

## Next Steps

1. Review [API Documentation](./API_DOCUMENTATION.md)
2. Test all API endpoints
3. Customize templates in database
4. Configure production email/SMS providers
5. Set up monitoring and alerting
6. Deploy to production environment

---

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review error messages in console
- Verify all services are running
- Check environment variables

## Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production setup instructions.
