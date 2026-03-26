# Notification Orchestrator - Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Setup
npm install
cp .env.example .env
createdb notification_orchestrator
npm run migrate

# Run
npm run dev              # Development mode
npm start               # Production mode
npm test                # Run tests

# Database
psql -U postgres -d notification_orchestrator
npm run migrate         # Run migrations
```

---

## 🔌 API Quick Reference

### Base URL
```
http://localhost:3000/api
```

### 1. Send Notification
```bash
POST /api/notifications/events
Content-Type: application/json

{
  "event_type": "user_signup",
  "user_id": "uuid-here",
  "priority": "normal",
  "metadata": {
    "first_name": "John"
  }
}

Response: 202 Accepted
{
  "event_id": "evt_abc123",
  "notification_id": "uuid",
  "status": "accepted"
}
```

### 2. Check Status
```bash
GET /api/notifications/{event_id}/status

Response: 200 OK
{
  "status": "delivered",
  "delivery_logs": [...]
}
```

### 3. Get Preferences
```bash
GET /api/users/{userId}/preferences

Response: 200 OK
{
  "preferences": [
    {
      "channel": "email",
      "category": "marketing",
      "enabled": true
    }
  ]
}
```

### 4. Update Preferences
```bash
PUT /api/users/{userId}/preferences
Content-Type: application/json

{
  "preferences": [
    {
      "channel": "email",
      "category": "marketing",
      "enabled": false
    }
  ]
}
```

### 5. Health Check
```bash
GET /health

Response: 200 OK
{
  "status": "healthy",
  "uptime": 120
}
```

---

## 📊 Event Types & Categories

| Event Type | Category | Description |
|------------|----------|-------------|
| user_signup | transactional | User registration |
| order_placed | transactional | Order confirmation |
| password_reset | security | Password reset |
| security_alert | security | Security alerts |
| promotional | marketing | Marketing campaigns |
| newsletter | marketing | Newsletters |
| system_maintenance | system_alerts | System updates |

---

## 🎚️ Priority Levels

- `low` - Can be throttled, respects quiet hours
- `normal` - Default, standard processing
- `high` - Higher priority, less throttling
- `critical` - Bypasses rate limits and quiet hours

---

## 📮 Channels

- `email` - Email notifications
- `sms` - SMS messages
- `push` - Push notifications
- `in_app` - In-app messages

---

## 📊 Status Values

- `received` - Event received
- `queued` - In processing queue
- `scheduled` - Scheduled for future
- `sent` - Sent to at least one channel
- `delivered` - Delivered on all channels
- `failed` - All delivery attempts failed
- `suppressed` - Blocked by preferences

---

## 🗄️ Database Quick Queries

```sql
-- View recent notifications
SELECT event_id, event_type, status, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- View delivery logs
SELECT n.event_id, dl.channel, dl.status, dl.sent_at
FROM delivery_logs dl
JOIN notifications n ON dl.notification_id = n.id
ORDER BY dl.created_at DESC 
LIMIT 10;

-- Check user preferences
SELECT channel, category, enabled 
FROM user_preferences 
WHERE user_id = 'your-user-id';

-- Get test user ID
SELECT id, email FROM users WHERE email = 'test@example.com';

-- Success rate by channel
SELECT channel, 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
FROM delivery_logs
GROUP BY channel;
```

---

## 🔧 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notification_orchestrator
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Quiet Hours (24-hour format)
QUIET_HOURS_START=22
QUIET_HOURS_END=7
```

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep notification_orchestrator

# Recreate database
dropdb notification_orchestrator
createdb notification_orchestrator
npm run migrate
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# Start Redis
redis-server

# Check Redis port
redis-cli -p 6379 ping
```

### Email Not Sending
```bash
# Use Mailtrap for testing
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
```

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

## 📝 Logs

```bash
# View all logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# Search logs
grep "error" logs/combined.log
grep "notification_id" logs/combined.log
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- example.test.js

# API test script
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/server.js` | Main entry point |
| `src/services/orchestration.service.js` | Core logic |
| `src/database/schema.sql` | Database schema |
| `.env` | Configuration |
| `package.json` | Dependencies |
| `README.md` | Main documentation |

---

## 🎯 Demo Checklist

- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Application started
- [ ] Get test user ID
- [ ] Test health endpoint
- [ ] Send notification
- [ ] Check status
- [ ] Update preferences
- [ ] Show database records
- [ ] Show logs

---

## 📚 Documentation

- `README.md` - Main documentation
- `docs/SETUP_GUIDE.md` - Installation guide
- `docs/API_DOCUMENTATION.md` - API reference
- `docs/ARCHITECTURE.md` - System design
- `docs/PROJECT_REPORT.md` - Project report
- `DEMO_GUIDE.md` - Demo instructions
- `PROJECT_SUMMARY.md` - Project summary

---

## 🔗 Useful Links

- Node.js: https://nodejs.org/
- Express.js: https://expressjs.com/
- PostgreSQL: https://www.postgresql.org/
- Redis: https://redis.io/
- Nodemailer: https://nodemailer.com/
- Mailtrap: https://mailtrap.io/

---

## 💡 Tips

1. Always check logs first when debugging
2. Use Mailtrap for email testing
3. Keep Redis running in background
4. Use Postman for API testing
5. Check database with psql for verification
6. Monitor logs in real-time during demo
7. Have backup test data ready

---

**Quick Help:** For detailed information, see `docs/SETUP_GUIDE.md`
