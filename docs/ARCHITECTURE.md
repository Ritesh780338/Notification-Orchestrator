# Notification Orchestrator - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Services                           │
│  (Billing, Auth, Marketing, Engagement, etc.)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                 │
│  - Rate Limiting                                                 │
│  - Authentication                                                │
│  - Request Validation                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Notification Ingestion Service                      │
│  - Event validation                                              │
│  - Event ID generation                                           │
│  - Database persistence                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Orchestration Engine                            │
│  ┌──────────────────────────────────────────────────┐           │
│  │  1. Fetch notification details                   │           │
│  │  2. Check scheduling                             │           │
│  │  3. Determine channels (preferences + rules)     │           │
│  │  4. Apply throttling & rate limits               │           │
│  │  5. Check quiet hours                            │           │
│  │  6. Process each channel                         │           │
│  └──────────────────────────────────────────────────┘           │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Email     │ │    SMS      │ │    Push     │ │   In-App    │
│   Adapter   │ │   Adapter   │ │   Adapter   │ │   Adapter   │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │               │
       ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   SMTP/     │ │   Twilio/   │ │   FCM/      │ │  Database   │
│   AWS SES   │ │   AWS SNS   │ │   APNs      │ │   Storage   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Component Details

### 1. API Gateway
**Responsibilities:**
- Rate limiting (100 req/min default)
- Request validation
- CORS handling
- Security headers (Helmet)

**Technology:** Express.js middleware

---

### 2. Notification Ingestion Service
**Responsibilities:**
- Accept notification events
- Validate event schema
- Generate unique event IDs
- Store in database
- Trigger async processing

**Key Functions:**
- `ingestEvent()` - Main entry point
- `getNotificationStatus()` - Status queries
- `processScheduledNotifications()` - Scheduled job

---

### 3. Orchestration Engine
**Responsibilities:**
- Channel selection logic
- User preference enforcement
- Rate limiting checks
- Quiet hours enforcement
- Template rendering
- Retry management
- Delivery tracking

**Decision Flow:**
```
1. Is notification scheduled? → Queue for later
2. Check user preferences → Filter channels
3. Check suppression list → Block if suppressed
4. Check rate limits → Throttle if exceeded
5. Check quiet hours → Defer if applicable
6. For each channel:
   - Get template
   - Render with variables
   - Send via adapter
   - Log delivery status
   - Retry on failure (3 attempts)
```

---

### 4. Template Engine
**Responsibilities:**
- Template storage and versioning
- Variable substitution
- Template validation
- Preview rendering

**Template Format:**
```
Subject: Welcome {{first_name}}!
Body: Hi {{first_name}}, your order {{order_id}} is ready.
```

---

### 5. Preference Service
**Responsibilities:**
- Store user preferences
- Channel-level opt-in/opt-out
- Category-based preferences
- Suppression list management

**Preference Matrix:**
```
User → Channel → Category → Enabled/Disabled

Example:
user_123 → email → marketing → false
user_123 → email → transactional → true
user_123 → sms → security → true
```

---

### 6. Channel Adapters

#### Email Adapter
- **Provider:** SMTP/Nodemailer
- **Features:** HTML support, attachments
- **Retry:** 3 attempts with exponential backoff

#### SMS Adapter
- **Provider:** Mock (Twilio/AWS SNS in production)
- **Features:** Character limit validation
- **Retry:** 3 attempts

#### Push Adapter
- **Provider:** Mock (FCM/APNs in production)
- **Features:** Title + body, badge counts
- **Retry:** 3 attempts

#### In-App Adapter
- **Provider:** Database storage
- **Features:** Real-time via WebSocket (future)
- **Retry:** Not applicable

---

### 7. Delivery Tracker
**Responsibilities:**
- Log all delivery attempts
- Track status transitions
- Store provider responses
- Support status queries

**Status Lifecycle:**
```
received → queued → sent → delivered
                    ↓
                  failed (with retries)
                    ↓
                suppressed (by preferences)
```

---

### 8. Dead Letter Queue
**Responsibilities:**
- Store permanently failed notifications
- Manual retry capability
- Failure analysis

**Triggers:**
- Max retry attempts exceeded
- Invalid user data
- Provider permanent failures

---

## Data Models

### Notifications Table
```sql
- id (UUID, PK)
- event_id (unique)
- event_type
- user_id (FK)
- priority
- metadata (JSON)
- preferred_channels (array)
- schedule_time
- status
- created_at, updated_at
```

### User Preferences Table
```sql
- id (UUID, PK)
- user_id (FK)
- channel
- category
- enabled
- created_at, updated_at
```

### Templates Table
```sql
- id (UUID, PK)
- template_id (unique)
- channel
- event_type
- subject
- body
- version
- active
- created_at, updated_at
```

### Delivery Logs Table
```sql
- id (UUID, PK)
- notification_id (FK)
- channel
- status
- attempt_count
- rendered_content
- provider_response (JSON)
- error_message
- sent_at, delivered_at
- created_at
```

---

## Technology Stack

### Backend
- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Language:** JavaScript

### Database
- **Primary:** PostgreSQL 12+
- **Cache:** Redis 6+

### External Services
- **Email:** SMTP/AWS SES
- **SMS:** Twilio/AWS SNS
- **Push:** FCM/APNs

### Libraries
- **Validation:** Joi
- **Logging:** Winston
- **Security:** Helmet, CORS
- **Rate Limiting:** express-rate-limit
- **Email:** Nodemailer

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Load balancer distribution
- Shared Redis cache
- Database connection pooling

### Performance Optimizations
- Async processing
- Batch operations
- Database indexing
- Redis caching for preferences

### Reliability
- Retry with exponential backoff
- Dead letter queue
- Health checks
- Graceful shutdown

---

## Security Features

1. **Authentication:** JWT/OAuth2 (to be implemented)
2. **Authorization:** Role-based access control
3. **Encryption:** TLS in transit, at-rest encryption
4. **Rate Limiting:** Per-IP and per-user
5. **Input Validation:** Joi schema validation
6. **SQL Injection:** Parameterized queries
7. **CORS:** Configured origins
8. **Headers:** Helmet security headers

---

## Monitoring & Observability

### Logging
- Structured JSON logs
- Log levels: error, warn, info, debug
- Separate error log file
- Request/response logging

### Metrics (Future)
- Event ingestion rate
- Delivery success rate
- Channel performance
- Processing latency
- Queue depth

### Alerting (Future)
- Delivery failure spikes
- Queue backlog
- Provider downtime
- Rate limit breaches

---

## Future Enhancements

1. **Message Queue:** Kafka/RabbitMQ for better scalability
2. **WebSocket:** Real-time in-app notifications
3. **Analytics Dashboard:** Delivery metrics and insights
4. **A/B Testing:** Template performance testing
5. **AI Optimization:** Smart send-time optimization
6. **Multi-tenancy:** Support multiple organizations
7. **Webhook Support:** Delivery status callbacks
8. **Template Builder UI:** Visual template editor

---

## Deployment Architecture

### Development
```
Single server:
- Node.js app
- PostgreSQL
- Redis
```

### Production
```
Load Balancer
    ↓
Multiple App Servers (Auto-scaling)
    ↓
RDS PostgreSQL (Multi-AZ)
ElastiCache Redis (Cluster)
```

---

## API Flow Example

### Send Welcome Email

1. **Client Request:**
```bash
POST /api/notifications/events
{
  "event_type": "user_signup",
  "user_id": "uuid",
  "metadata": {"first_name": "John"}
}
```

2. **Ingestion Service:**
- Validates payload
- Generates event_id
- Stores in database
- Returns 202 Accepted

3. **Orchestration Engine:**
- Fetches notification
- Determines channels (email, in_app)
- Checks preferences (both allowed)
- Checks rate limits (within limit)

4. **Template Engine:**
- Fetches "welcome_email" template
- Renders: "Hi John, Welcome to our platform!"

5. **Email Adapter:**
- Sends via SMTP
- Logs delivery status
- Updates notification status

6. **Response:**
```json
{
  "event_id": "evt_abc123",
  "status": "accepted"
}
```

---

## Conclusion

The Notification Orchestrator provides a robust, scalable solution for centralized notification management. Its modular architecture allows for easy extension and maintenance while ensuring reliable delivery across multiple channels.
