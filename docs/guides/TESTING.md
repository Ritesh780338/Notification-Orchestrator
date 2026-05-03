# Notification Orchestrator - Testing Guide

## Quick Start Testing

Your server is running at: **http://localhost:3000**

---

## Test Scenario 1: User Signup Notification

### Form Fields:
- **User ID**: `user_12345`
- **Event Type**: `user_signup`
- **Priority**: `Normal`
- **Preferred Channels**: Check `Email` and `SMS`
- **Metadata (JSON)**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890"
}
```

---

## Test Scenario 2: Order Confirmation

### Form Fields:
- **User ID**: `user_67890`
- **Event Type**: `order_confirmation`
- **Priority**: `High`
- **Preferred Channels**: Check `Email`, `SMS`, and `Push`
- **Metadata (JSON)**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@example.com",
  "order_id": "ORD-2026-001",
  "amount": "149.99"
}
```

---

## Test Scenario 3: Password Reset

### Form Fields:
- **User ID**: `user_11111`
- **Event Type**: `password_reset`
- **Priority**: `Urgent`
- **Preferred Channels**: Check `Email` and `SMS`
- **Metadata (JSON)**:
```json
{
  "first_name": "Michael",
  "email": "michael.brown@example.com",
  "reset_code": "ABC123XYZ"
}
```

---

## Test Scenario 4: Marketing Campaign

### Form Fields:
- **User ID**: `user_22222`
- **Event Type**: `marketing`
- **Priority**: `Low`
- **Preferred Channels**: Check `Email` and `Push`
- **Metadata (JSON)**:
```json
{
  "first_name": "Sarah",
  "email": "sarah.wilson@example.com",
  "campaign_name": "Spring Sale 2026",
  "discount_code": "SPRING30"
}
```

---

## Test Scenario 5: Security Alert

### Form Fields:
- **User ID**: `user_33333`
- **Event Type**: `security_alert`
- **Priority**: `Urgent`
- **Preferred Channels**: Check `Email`, `SMS`, `Push`, and `In-App`
- **Metadata (JSON)**:
```json
{
  "first_name": "David",
  "email": "david.lee@example.com",
  "alert_type": "Suspicious Login Attempt",
  "timestamp": "2026-04-21 10:45:00"
}
```

---

## Test Scenario 6: System Notification

### Form Fields:
- **User ID**: `user_44444`
- **Event Type**: `system_notification`
- **Priority**: `Normal`
- **Preferred Channels**: Check `In-App` and `Email`
- **Metadata (JSON)**:
```json
{
  "first_name": "Emily",
  "email": "emily.davis@example.com",
  "notification_type": "System Maintenance",
  "maintenance_date": "2026-04-22"
}
```

---

## Test Scenario 7: Scheduled Notification

### Form Fields:
- **User ID**: `user_55555`
- **Event Type**: `user_signup`
- **Priority**: `Normal`
- **Preferred Channels**: Check `Email`
- **Schedule Time**: `2026-04-21T18:00:00` (6 PM today)
- **Metadata (JSON)**:
```json
{
  "first_name": "Robert",
  "email": "robert.taylor@example.com",
  "welcome_bonus": "50"
}
```

---

## Testing with cURL (Command Line)

### User Signup:
```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_12345",
    "event_type": "user_signup",
    "priority": "normal",
    "preferred_channels": ["email", "sms"],
    "metadata": {
      "first_name": "John",
      "email": "john.doe@example.com"
    }
  }'
```

### Order Confirmation:
```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_67890",
    "event_type": "order_confirmation",
    "priority": "high",
    "preferred_channels": ["email", "push"],
    "metadata": {
      "first_name": "Jane",
      "order_id": "ORD-2026-001",
      "amount": "149.99"
    }
  }'
```

### Security Alert:
```bash
curl -X POST http://localhost:3000/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_33333",
    "event_type": "security_alert",
    "priority": "urgent",
    "preferred_channels": ["email", "sms", "push"],
    "metadata": {
      "first_name": "David",
      "alert_type": "Suspicious Login",
      "timestamp": "2026-04-21 10:45:00"
    }
  }'
```

---

## API Endpoints for Testing

### 1. Send Notification Event
- **URL**: `POST http://localhost:3000/api/notifications/events`
- **Body**: JSON with user_id, event_type, priority, preferred_channels, metadata

### 2. Check Notification Status
- **URL**: `GET http://localhost:3000/api/notifications/{notification_id}/status`

### 3. Get User Preferences
- **URL**: `GET http://localhost:3000/api/users/{user_id}/preferences`

### 4. Update User Preferences
- **URL**: `PUT http://localhost:3000/api/users/{user_id}/preferences`
- **Body**: 
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "channels": {
    "email": true,
    "sms": true,
    "push": false,
    "inapp": true
  }
}
```

### 5. Get Templates
- **URL**: `GET http://localhost:3000/api/templates`

### 6. Create Template
- **URL**: `POST http://localhost:3000/api/templates`

---

## Expected Results

After sending a notification, you should see:
1. ✅ Success message with notification ID
2. 📊 Notification appears in the logs
3. 🔔 Delivery status for each channel
4. 📝 Template rendering with metadata

## Troubleshooting

- If notifications fail, check the logs at `logs/combined.log`
- Verify MongoDB is running: `docker ps`
- Check Redis connection in the server logs
- Ensure all required metadata fields are provided

---

## Demo Users Summary

| User ID | Name | Email | Use Case |
|---------|------|-------|----------|
| user_12345 | John Doe | john.doe@example.com | User Signup |
| user_67890 | Jane Smith | jane.smith@example.com | Order Confirmation |
| user_11111 | Michael Brown | michael.brown@example.com | Password Reset |
| user_22222 | Sarah Wilson | sarah.wilson@example.com | Marketing |
| user_33333 | David Lee | david.lee@example.com | Security Alert |
| user_44444 | Emily Davis | emily.davis@example.com | System Notification |
| user_55555 | Robert Taylor | robert.taylor@example.com | Scheduled Notification |

---

**Happy Testing! 🚀**
