# Notification Orchestrator - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently using basic authentication. In production, implement OAuth2/JWT.

---

## Endpoints

### 1. Ingest Notification Event

**Endpoint:** `POST /notifications/events`

**Description:** Accept notification events from internal services for processing and delivery.

**Request Body:**
```json
{
  "event_type": "user_signup",
  "user_id": "uuid-here",
  "priority": "normal",
  "metadata": {
    "first_name": "John",
    "email": "john@example.com"
  },
  "preferred_channels": ["email", "sms"],
  "schedule_time": "2024-12-31T10:00:00Z"
}
```

**Parameters:**
- `event_type` (string, required): Type of event (e.g., user_signup, order_placed)
- `user_id` (UUID, required): User identifier
- `priority` (string, optional): Priority level - low, normal, high, critical (default: normal)
- `metadata` (object, optional): Dynamic payload for template variables
- `preferred_channels` (array, optional): Override default channel selection
- `schedule_time` (ISO 8601, optional): Schedule for future delivery

**Response:** `202 Accepted`
```json
{
  "message": "Event accepted",
  "event_id": "evt_abc123",
  "notification_id": "uuid-here",
  "status": "accepted"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid payload
- `404 Not Found`: User not found
- `500 Internal Server Error`: Processing error

---

### 2. Get User Preferences

**Endpoint:** `GET /users/{userId}/preferences`

**Description:** Retrieve user's notification preferences across all channels and categories.

**Response:** `200 OK`
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
      "channel": "sms",
      "category": "transactional",
      "enabled": true
    }
  ]
}
```

---

### 3. Update User Preferences

**Endpoint:** `PUT /users/{userId}/preferences`

**Description:** Update user's notification preferences.

**Request Body:**
```json
{
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
}
```

**Parameters:**
- `channel` (string, required): email, sms, push, in_app
- `category` (string, required): marketing, transactional, security, system_alerts
- `enabled` (boolean, required): true or false

**Response:** `200 OK`
```json
{
  "message": "Preferences updated successfully",
  "user_id": "uuid-here",
  "preferences": [...]
}
```

---

### 4. Get Notification Status

**Endpoint:** `GET /notifications/{id}/status`

**Description:** Get notification status and delivery logs. Accepts either notification_id or event_id.

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "event_id": "evt_abc123",
  "event_type": "user_signup",
  "user_id": "uuid-here",
  "priority": "normal",
  "status": "delivered",
  "schedule_time": null,
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

**Status Values:**
- `received`: Event received
- `queued`: In processing queue
- `scheduled`: Scheduled for future
- `sent`: Sent to at least one channel
- `delivered`: Delivered on all channels
- `failed`: All delivery attempts failed
- `suppressed`: Blocked by user preferences

---

### 5. Health Check

**Endpoint:** `GET /health`

**Description:** Check service health status.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600
}
```

---

## Event Types & Categories

### Event Type to Category Mapping

| Event Type | Category | Description |
|------------|----------|-------------|
| user_signup | transactional | User registration |
| order_placed | transactional | Order confirmation |
| order_shipped | transactional | Shipping notification |
| password_reset | security | Password reset request |
| security_alert | security | Security-related alerts |
| login_alert | security | Login notifications |
| promotional | marketing | Marketing campaigns |
| newsletter | marketing | Newsletter emails |
| system_maintenance | system_alerts | System updates |

---

## Rate Limiting

- Default: 100 requests per minute per IP
- Configurable via environment variables
- Returns `429 Too Many Requests` when exceeded

---

## Error Handling

All errors follow this format:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": ["Additional information"]
}
```

---

## Example Usage

### Send Welcome Email
```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_signup",
    "user_id": "user-uuid-here",
    "priority": "normal",
    "metadata": {
      "first_name": "John",
      "email": "john@example.com"
    }
  }'
```

### Update Preferences
```bash
curl -X PUT http://localhost:3000/api/users/user-uuid-here/preferences \
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

### Check Status
```bash
curl http://localhost:3000/api/notifications/evt_abc123/status
```
