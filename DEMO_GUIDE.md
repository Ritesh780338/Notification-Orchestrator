# Notification Orchestrator - Demo Guide

This guide will help you demonstrate the Notification Orchestrator project for your college presentation.

## 🎯 Demo Scenario

We'll demonstrate a complete notification flow for a user signup event.

---

## 📋 Pre-Demo Checklist

1. ✅ PostgreSQL running
2. ✅ Redis running
3. ✅ Application started (`npm run dev`)
4. ✅ Database migrated with sample data
5. ✅ Postman or curl ready for API calls

---

## 🎬 Demo Script

### Step 1: Show System Health

```bash
curl http://localhost:3000/health
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 120
}
```

**Talking Points:**
- System is running and healthy
- Shows uptime and timestamp
- Basic health monitoring

---

### Step 2: Get Test User ID

```bash
psql -U postgres -d notification_orchestrator -c "SELECT id, email FROM users WHERE email = 'test@example.com';"
```

Copy the UUID for next steps.

---

### Step 3: Check User Preferences

```bash
curl http://localhost:3000/api/users/YOUR_USER_ID/preferences
```

**Expected Output:**
```json
{
  "user_id": "uuid-here",
  "preferences": [
    {
      "channel": "email",
      "category": "marketing",
      "enabled": true
    },
    {
      "channel": "email",
      "category": "transactional",
      "enabled": true
    }
    // ... more preferences
  ]
}
```

**Talking Points:**
- User has granular control over notifications
- Preferences by channel (email, sms, push, in-app)
- Preferences by category (marketing, transactional, security, system_alerts)

---

### Step 4: Send Welcome Notification

```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_signup",
    "user_id": "YOUR_USER_ID",
    "priority": "normal",
    "metadata": {
      "first_name": "Demo User"
    }
  }'
```

**Expected Output:**
```json
{
  "message": "Event accepted",
  "event_id": "evt_abc123xyz",
  "notification_id": "uuid-here",
  "status": "accepted"
}
```

**Talking Points:**
- Event accepted immediately (202 status)
- Unique event_id generated
- Processing happens asynchronously
- System returns quickly without blocking

---

### Step 5: Check Notification Status

Wait 2-3 seconds, then:

```bash
curl http://localhost:3000/api/notifications/evt_abc123xyz/status
```

**Expected Output:**
```json
{
  "id": "uuid-here",
  "event_id": "evt_abc123xyz",
  "event_type": "user_signup",
  "user_id": "uuid-here",
  "priority": "normal",
  "status": "delivered",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:05Z",
  "delivery_logs": [
    {
      "channel": "email",
      "status": "delivered",
      "attempt_count": 1,
      "sent_at": "2024-01-15T10:00:02Z",
      "delivered_at": "2024-01-15T10:00:05Z",
      "error_message": null
    },
    {
      "channel": "sms",
      "status": "delivered",
      "attempt_count": 1,
      "sent_at": "2024-01-15T10:00:03Z",
      "delivered_at": "2024-01-15T10:00:04Z",
      "error_message": null
    }
  ]
}
```

**Talking Points:**
- Complete delivery tracking
- Status lifecycle: received → queued → sent → delivered
- Multiple channels processed
- Timestamps for each stage
- Attempt count for retry tracking

---

### Step 6: Update User Preferences (Opt-out)

```bash
curl -X PUT http://localhost:3000/api/users/YOUR_USER_ID/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "channel": "email",
        "category": "marketing",
        "enabled": false
      },
      {
        "channel": "sms",
        "category": "marketing",
        "enabled": false
      }
    ]
  }'
```

**Talking Points:**
- User opts out of marketing emails and SMS
- Transactional and security notifications still allowed
- GDPR-compliant preference management

---

### Step 7: Send Marketing Notification

```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "promotional",
    "user_id": "YOUR_USER_ID",
    "priority": "low",
    "metadata": {
      "first_name": "Demo User",
      "offer": "50% off"
    }
  }'
```

Check status - should show "suppressed" for email and SMS channels.

**Talking Points:**
- System respects user preferences
- Marketing notifications blocked
- Compliance with user choices

---

### Step 8: Send Critical Security Alert

```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "security_alert",
    "user_id": "YOUR_USER_ID",
    "priority": "critical",
    "metadata": {
      "first_name": "Demo User",
      "location": "New York, USA"
    }
  }'
```

**Talking Points:**
- Critical priority bypasses rate limits
- Security alerts bypass quiet hours
- Always delivered regardless of marketing opt-out

---

### Step 9: Schedule Future Notification

```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "newsletter",
    "user_id": "YOUR_USER_ID",
    "priority": "low",
    "schedule_time": "2024-12-31T10:00:00Z",
    "metadata": {
      "first_name": "Demo User"
    }
  }'
```

Check status - should show "scheduled".

**Talking Points:**
- Support for scheduled notifications
- Useful for campaigns and reminders
- Background job processes scheduled items

---

### Step 10: Show Database Records

```bash
# Show recent notifications
psql -U postgres -d notification_orchestrator -c "
SELECT event_id, event_type, status, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;"

# Show delivery logs
psql -U postgres -d notification_orchestrator -c "
SELECT n.event_id, dl.channel, dl.status, dl.sent_at 
FROM delivery_logs dl
JOIN notifications n ON dl.notification_id = n.id
ORDER BY dl.created_at DESC 
LIMIT 10;"
```

**Talking Points:**
- All data persisted in database
- Full audit trail
- Historical tracking for analytics

---

## 🎨 Visual Demo Tips

### 1. Terminal Setup
- Use 3 terminal windows:
  - Window 1: Application logs (`npm run dev`)
  - Window 2: API calls (curl/Postman)
  - Window 3: Database queries

### 2. Postman Collection
Create a Postman collection with all demo requests pre-configured.

### 3. Log Monitoring
Show real-time logs while sending notifications:
```bash
tail -f logs/combined.log
```

---

## 💡 Key Features to Highlight

1. **Multi-Channel Support**
   - Email, SMS, Push, In-App
   - Parallel delivery
   - Channel-specific templates

2. **User Preferences**
   - Granular control
   - Category-based
   - Compliance-ready

3. **Intelligent Routing**
   - Priority-based
   - Rate limiting
   - Quiet hours

4. **Reliability**
   - Retry mechanism
   - Exponential backoff
   - Dead letter queue

5. **Observability**
   - Complete tracking
   - Status lifecycle
   - Delivery logs

6. **Scalability**
   - Async processing
   - Stateless design
   - Horizontal scaling ready

---

## 🎤 Presentation Flow

### Introduction (2 min)
- Problem statement
- Why centralized notifications?
- Project goals

### Architecture Overview (3 min)
- Show architecture diagram
- Explain components
- Data flow

### Live Demo (10 min)
- Follow demo script above
- Show 3-4 key scenarios
- Highlight features

### Code Walkthrough (5 min)
- Show key files:
  - `src/services/orchestration.service.js`
  - `src/adapters/email.adapter.js`
  - `src/database/schema.sql`

### Conclusion (2 min)
- Success metrics
- Future enhancements
- Q&A

---

## 🐛 Troubleshooting

### Email Not Sending
- Check SMTP credentials in `.env`
- Use Mailtrap for demo
- Show mock SMS/Push instead

### Database Connection Error
- Ensure PostgreSQL is running
- Check credentials
- Run migrations

### Redis Connection Error
- Start Redis: `redis-server`
- Check port 6379

---

## 📊 Metrics to Show

```bash
# Count total notifications
psql -U postgres -d notification_orchestrator -c "
SELECT COUNT(*) as total_notifications FROM notifications;"

# Success rate by channel
psql -U postgres -d notification_orchestrator -c "
SELECT channel, 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
       ROUND(100.0 * SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM delivery_logs
GROUP BY channel;"
```

---

## 🎯 Demo Success Checklist

- [ ] System health check passes
- [ ] User preferences retrieved
- [ ] Notification sent successfully
- [ ] Status tracking works
- [ ] Preference update works
- [ ] Suppression demonstrated
- [ ] Scheduling demonstrated
- [ ] Database records shown
- [ ] Logs displayed
- [ ] Architecture explained

---

Good luck with your presentation! 🚀
