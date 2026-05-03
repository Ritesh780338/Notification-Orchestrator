# 📖 Quick Reference - Notification Orchestrator

## 🎯 Common Test Data

### User Signup
```json
{
  "user_id": "user_001",
  "event_type": "user_signup",
  "priority": "normal",
  "preferred_channels": ["email", "push"],
  "metadata": {
    "first_name": "Priya",
    "last_name": "Sharma",
    "email": "priya@example.com",
    "plan": "Pro"
  }
}
```

### Order Confirmation
```json
{
  "user_id": "user_042",
  "event_type": "order_confirmation",
  "priority": "high",
  "preferred_channels": ["email", "sms"],
  "metadata": {
    "first_name": "Arjun",
    "order_id": "ORD-7821",
    "amount": "₹2,499",
    "items": 3
  }
}
```

### Password Reset
```json
{
  "user_id": "user_077",
  "event_type": "password_reset",
  "priority": "urgent",
  "preferred_channels": ["email"],
  "metadata": {
    "first_name": "Rahul",
    "reset_code": "ABC123",
    "reset_link": "https://example.com/reset/tok123"
  }
}
```

### Security Alert
```json
{
  "user_id": "user_099",
  "event_type": "security_alert",
  "priority": "urgent",
  "preferred_channels": ["email", "sms", "push"],
  "metadata": {
    "first_name": "Neha",
    "alert_type": "Unusual Login",
    "location": "Mumbai, India",
    "device": "iPhone 15"
  }
}
```

### Marketing
```json
{
  "user_id": "user_200",
  "event_type": "marketing",
  "priority": "low",
  "preferred_channels": ["email", "inapp"],
  "metadata": {
    "first_name": "Vikram",
    "campaign": "Diwali Sale",
    "discount": "30%",
    "promo_code": "DIWALI30"
  }
}
```

## 🔑 Field Reference

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `user_id` | string | ✅ Yes | Any unique identifier |
| `event_type` | string | ✅ Yes | `user_signup`, `order_confirmation`, `password_reset`, `marketing`, `security_alert`, `system_notification` |
| `priority` | string | No | `low`, `normal` (default), `high`, `urgent` |
| `preferred_channels` | array | No | `["email"]`, `["sms"]`, `["push"]`, `["inapp"]` or combinations |
| `metadata` | object | No | Any JSON object with template variables |
| `schedule_time` | ISO 8601 | No | `2026-05-05T10:00:00` |

## 🎨 Priority Levels

| Priority | Use Case | Processing |
|----------|----------|------------|
| 🟢 **Low** | Marketing, newsletters | Batch processing |
| 🔵 **Normal** | General notifications | Standard queue |
| 🟠 **High** | Orders, important updates | Priority queue |
| 🔴 **Urgent** | Security, password resets | Immediate |

## 📡 Channels

| Channel | Icon | Use Case |
|---------|------|----------|
| **Email** | ✉ | Detailed messages, receipts |
| **SMS** | 💬 | Time-sensitive, short alerts |
| **Push** | 📱 | Mobile app notifications |
| **In-App** | 🔔 | Non-intrusive updates |

## 🧪 Testing Workflow

1. **Open Browser Console** (F12)
2. **Navigate to Send Notification tab**
3. **Click "Auto-Fill Demo"** or enter data manually
4. **Click "Send Notification"**
5. **Check Console Logs** for detailed output
6. **View Result Box** for success/error message

## 🐛 Common Errors

### "Unexpected token '<'"
- **Cause:** Server returned HTML instead of JSON
- **Fix:** Check server is running, verify endpoint URL

### "user_id is required"
- **Cause:** Missing required field
- **Fix:** Fill in User ID field

### "Invalid JSON in metadata"
- **Cause:** Malformed JSON syntax
- **Fix:** Use "Format JSON" button or check syntax

### "Select at least one channel"
- **Cause:** No channels selected
- **Fix:** Click at least one channel chip

## 📊 Console Log Patterns

### Success Pattern
```
[AutoFill] Button clicked
[FillForm] Starting to fill form
[SendForm] Form submitted
[API] Request: POST /api/notifications/events
[API] Response Status: 202 Accepted
[Toast] SUCCESS: ✅ Notification sent successfully!
```

### Error Pattern
```
[SendForm] Form submitted
[API] Request: POST /api/notifications/events
[API] Response Status: 400 Bad Request
[API] Error Response: Validation error
[Toast] ERROR: ❌ Validation error
```

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/notifications/events` | Send notification |
| GET | `/api/notifications/:id/status` | Check status |
| GET | `/api/notifications/stats` | Get statistics |
| GET | `/api/users/:userId/preferences` | Get preferences |
| PUT | `/api/users/:userId/preferences` | Update preferences |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| GET | `/health` | Health check |

## 💡 Pro Tips

1. **Use Auto-Fill** for quick testing
2. **Check Console** (F12) for detailed logs
3. **Format JSON** button validates metadata
4. **Copy event_id** from response to track status
5. **Use Quick Test** tab for rapid testing
6. **Hard Refresh** (Ctrl+Shift+R) if changes don't appear

## 📞 Troubleshooting

1. ✅ Server running? Check `http://localhost:3000/health`
2. ✅ MongoDB connected? Check server logs
3. ✅ Redis connected? Check server logs
4. ✅ Browser cache cleared? Hard refresh (Ctrl+Shift+R)
5. ✅ Console errors? Press F12 and check

---

**Quick Start:** Click "Auto-Fill Demo" → Click "Send Notification" → Check Console (F12)
