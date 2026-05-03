# API Reference - Notification Orchestrator

Complete API documentation for the Notification Orchestrator service.

---

## Base URL

```
Local: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Notifications](#notifications)
3. [User Preferences](#user-preferences)
4. [Templates](#templates)
5. [Status & Monitoring](#status--monitoring)
6. [Error Handling](#error-handling)

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

**Future**: JWT-based authentication will be added.

---

## Notifications

### Send Notification Event

Create and send a notification event.

**Endpoint**: `POST /api/notifications/events`

**Request Body**:
```json
{
  "event_type": "user_signup",
  "user_id": "user_123",
  "priority": "normal",
  "metadata": {
    "first_name": "John",
    "email": "john@example.com"
  },
  "preferred_channels": ["email", "sms"],
  "schedule_time": "2026-05-04T10:00:00Z"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_type` | string | Yes | Type of event: `user_signup`, `order_confirmation`, `password_reset`, `marketing`, `security_alert`, `system_notification` |
| `user_id` | string | Yes | Unique identifier for the user |
| `priority` | string | No | Priority level: `low`, `normal`, `high`, `urgent` (default: `normal`) |
| `metadata` | object | No | Additional data for template variables |
| `preferred_channels` | array | No | Channels to use: `email`, `sms`, `push`, `inapp` |
| `schedule_time` | string | No | ISO 8601 datetime for scheduled delivery |

**Response** (202 Accepted):
```json
{
  "message": "Event accepted for processing",
  "event_id": "evt_337886ad-74a6-4007-8664-a31d6de14f76",
  "notification_id": "69f2489fbdc4df48c3794c38",
  "status": "accepted"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_signup",
    "user_id": "user_123",
    "priority": "normal",
    "metadata": {
      "first_name": "John"
    }
  }'
```

---

### Get Notification Status

Retrieve the status of a notification by event ID or notification ID.

**Endpoint**: `GET /api/notifications/:id/status`

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Event ID (evt_xxx) or Notification ID (MongoDB ObjectId) |

**Response** (200 OK):
```json
{
  "event_id": "evt_337886ad-74a6-4007-8664-a31d6de14f76",
  "event_type": "user_signup",
  "user_id": "user_123",
  "priority": "normal",
  "status": "delivered",
  "channels": [
    {
      "channel_type": "email",
      "status": "delivered",
      "sent_at": "2026-05-03T10:15:30Z",
      "delivered_at": "2026-05-03T10:15:35Z"
    }
  ],
  "created_at": "2026-05-03T10:15:00Z",
  "updated_at": "2026-05-03T10:15:35Z"
}
```

**Status Values**:
- `received` - Event received
- `queued` - Queued for processing
- `processing` - Currently processing
- `sent` - Sent to channel
- `delivered` - Successfully delivered
- `failed` - Delivery failed
- `suppressed` - Suppressed due to user preferences
- `scheduled` - Scheduled for future delivery

**Example**:
```bash
curl http://localhost:3000/api/notifications/evt_337886ad-74a6-4007-8664-a31d6de14f76/status
```

---

### Get User Notifications

Retrieve all notifications for a specific user.

**Endpoint**: `GET /api/notifications/user/:userId`

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User identifier |
| `limit` | number | Number of results (default: 50) |
| `skip` | number | Number to skip for pagination (default: 0) |
| `status` | string | Filter by status |

**Response** (200 OK):
```json
{
  "notifications": [
    {
      "event_id": "evt_xxx",
      "event_type": "user_signup",
      "status": "delivered",
      "created_at": "2026-05-03T10:15:00Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "skip": 0
}
```

**Example**:
```bash
curl "http://localhost:3000/api/notifications/user/user_123?limit=10&status=delivered"
```

---

### Get Statistics

Retrieve notification statistics.

**Endpoint**: `GET /api/notifications/stats`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Start date (ISO 8601) |
| `endDate` | string | End date (ISO 8601) |

**Response** (200 OK):
```json
{
  "total": 150,
  "by_status": {
    "delivered": 120,
    "failed": 10,
    "pending": 20
  },
  "by_channel": {
    "email_delivered": 80,
    "sms_delivered": 40,
    "push_delivered": 30
  },
  "by_event_type": {
    "user_signup": 50,
    "order_confirmation": 60,
    "password_reset": 40
  }
}
```

**Example**:
```bash
curl "http://localhost:3000/api/notifications/stats?startDate=2026-05-01&endDate=2026-05-03"
```

---

## User Preferences

### Get User Preferences

Retrieve notification preferences for a user.

**Endpoint**: `GET /api/users/:userId/preferences`

**Response** (200 OK):
```json
{
  "user_id": "user_123",
  "email": "john@example.com",
  "phone": "+1234567890",
  "push_token": "fcm_token_xxx",
  "preferences": [
    {
      "channel": "email",
      "category": "marketing",
      "enabled": false
    },
    {
      "channel": "email",
      "category": "transactional",
      "enabled": true
    }
  ],
  "global_opt_out": false,
  "quiet_hours": {
    "enabled": true,
    "start_hour": 22,
    "end_hour": 7,
    "timezone": "UTC"
  }
}
```

**Example**:
```bash
curl http://localhost:3000/api/users/user_123/preferences
```

---

### Update User Preferences

Update notification preferences for a user.

**Endpoint**: `PUT /api/users/:userId/preferences`

**Request Body**:
```json
{
  "email": "john@example.com",
  "phone": "+1234567890",
  "push_token": "fcm_token_xxx",
  "preferences": [
    {
      "channel": "email",
      "category": "marketing",
      "enabled": false
    }
  ],
  "global_opt_out": false,
  "quiet_hours": {
    "enabled": true,
    "start_hour": 22,
    "end_hour": 7,
    "timezone": "UTC"
  }
}
```

**Response** (200 OK):
```json
{
  "message": "Preferences updated successfully",
  "user_id": "user_123"
}
```

**Example**:
```bash
curl -X PUT http://localhost:3000/api/users/user_123/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "preferences": [
      {
        "channel": "email",
        "category": "marketing",
        "enabled": false
      }
    ]
  }'
```

---

## Templates

### Get All Templates

Retrieve all notification templates.

**Endpoint**: `GET /api/templates`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `channel` | string | Filter by channel: `email`, `sms`, `push`, `inapp` |
| `event_type` | string | Filter by event type |
| `active` | boolean | Filter by active status |

**Response** (200 OK):
```json
{
  "templates": [
    {
      "template_id": "tpl_user_signup_email",
      "name": "User Signup Email",
      "channel": "email",
      "event_type": "user_signup",
      "subject": "Welcome {{first_name}}!",
      "body": "Hi {{first_name}}, welcome to our platform!",
      "variables": ["first_name"],
      "version": 1,
      "active": true
    }
  ],
  "total": 10
}
```

**Example**:
```bash
curl "http://localhost:3000/api/templates?channel=email&active=true"
```

---

### Get Template by ID

Retrieve a specific template.

**Endpoint**: `GET /api/templates/:templateId`

**Response** (200 OK):
```json
{
  "template_id": "tpl_user_signup_email",
  "name": "User Signup Email",
  "channel": "email",
  "event_type": "user_signup",
  "subject": "Welcome {{first_name}}!",
  "body": "Hi {{first_name}}, welcome to our platform!",
  "variables": ["first_name"],
  "version": 1,
  "active": true,
  "created_at": "2026-05-01T10:00:00Z",
  "updated_at": "2026-05-01T10:00:00Z"
}
```

---

### Create Template

Create a new notification template.

**Endpoint**: `POST /api/templates`

**Request Body**:
```json
{
  "template_id": "tpl_custom",
  "name": "Custom Template",
  "channel": "email",
  "event_type": "custom_event",
  "subject": "Hello {{name}}",
  "body": "This is a custom template for {{name}}",
  "variables": ["name"]
}
```

**Response** (201 Created):
```json
{
  "message": "Template created successfully",
  "template_id": "tpl_custom"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "tpl_custom",
    "name": "Custom Template",
    "channel": "email",
    "event_type": "custom_event",
    "subject": "Hello {{name}}",
    "body": "Custom message",
    "variables": ["name"]
  }'
```

---

### Update Template

Update an existing template.

**Endpoint**: `PUT /api/templates/:templateId`

**Request Body**:
```json
{
  "name": "Updated Template Name",
  "subject": "New Subject {{name}}",
  "body": "Updated body content",
  "active": true
}
```

**Response** (200 OK):
```json
{
  "message": "Template updated successfully",
  "template_id": "tpl_custom"
}
```

---

## Status & Monitoring

### Health Check

Check if the service is running.

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-05-03T10:00:00Z",
  "uptime": 3600.5,
  "database": "MongoDB"
}
```

**Example**:
```bash
curl http://localhost:3000/health
```

---

### API Info

Get API information and available endpoints.

**Endpoint**: `GET /api`

**Response** (200 OK):
```json
{
  "name": "Notification Orchestrator",
  "version": "1.0.0",
  "description": "Centralized Multi-Channel Notification Management Service",
  "author": "Ritesh Sharma (240410700085)",
  "database": "MongoDB",
  "endpoints": {
    "health": "GET /health",
    "ingestEvent": "POST /api/notifications/events",
    "getStatus": "GET /api/notifications/:id/status",
    "getPreferences": "GET /api/users/:userId/preferences",
    "updatePreferences": "PUT /api/users/:userId/preferences",
    "getTemplates": "GET /api/templates",
    "createTemplate": "POST /api/templates"
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": ["Additional error details"]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 202 | Accepted - Request accepted for processing |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

### Common Errors

**Validation Error** (400):
```json
{
  "error": "Validation error",
  "details": [
    "\"event_type\" is required",
    "\"user_id\" must be a string"
  ]
}
```

**Not Found** (404):
```json
{
  "error": "Notification not found"
}
```

**Internal Error** (500):
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Window**: 60 seconds
- **Response** (429 Too Many Requests):
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## Webhooks (Future)

Webhook support for notification events will be added in future versions.

---

## SDKs & Libraries (Future)

Official SDKs will be available for:
- Node.js
- Python
- PHP
- Java

---

## Support

For API support:
- GitHub Issues: https://github.com/Ritesh780338/Notification-Orchestrator/issues
- Email: ritesh@example.com

---

**API Version**: 1.0.0  
**Last Updated**: May 3, 2026  
**Author**: Ritesh Sharma (240410700085)
