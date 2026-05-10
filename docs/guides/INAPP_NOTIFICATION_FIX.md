# In-App Notification Fix

## Problem
In-app notifications were not working because there were no templates configured for the `inapp` channel. The logs showed:

```
warn: Template not found {"channel":"inapp","event_type":"user_signup","timestamp":"2026-05-10T19:18:20.623Z"}
```

## Root Cause
The default template initialization in `src/server.js` only included templates for `email` and `sms` channels, but not for `inapp` channel. When a notification was sent with the `inapp` channel selected, the orchestration service couldn't find a template to render the notification.

## Solution

### 1. Added In-App Templates
Created in-app templates for all event types:
- `user_signup` - Welcome message
- `order_confirmation` - Order confirmation
- `password_reset` - Password reset notification
- `security_alert` - Security alert
- `marketing` - Marketing message
- `system_notification` - System update

### 2. Updated Default Templates
Modified `src/server.js` to include in-app templates in the default template initialization for future deployments.

### 3. Created Migration Scripts
- `src/scripts/add-inapp-template.js` - Adds single user_signup in-app template
- `src/scripts/add-all-inapp-templates.js` - Adds all in-app templates (recommended)

### 4. Fixed Rate Limit Warning
Added `app.set('trust proxy', 1)` to fix the express-rate-limit warning about X-Forwarded-For header when deployed behind reverse proxies (Render, Netlify, etc.).

## How to Test

### 1. Verify Templates Exist
```bash
# Check that in-app templates are in the database
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./src/models/Template');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const templates = await Template.find({ channel: 'inapp' });
  console.log('In-app templates:', templates.length);
  templates.forEach(t => console.log('-', t.event_type, ':', t.subject));
  process.exit(0);
});
"
```

### 2. Send a Test Notification
1. Log in to the NotifyHub dashboard
2. Go to "Send Notification" tab
3. Enter a user ID or username (e.g., `rsharma`)
4. Select event type: `user_signup`
5. **Make sure to check the "inapp" channel checkbox**
6. Add metadata (optional):
   ```json
   {
     "first_name": "Ritesh"
   }
   ```
7. Click "Send Notification"

### 3. Check In-App Notifications
1. Click the bell icon (🔔) in the top right corner
2. You should see the notification appear in the notification center
3. The notification badge should show the unread count

### 4. Verify in Database
```bash
# Check InAppNotification collection
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const InAppNotification = require('./src/models/InAppNotification');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const notifications = await InAppNotification.find().sort({ created_at: -1 }).limit(5);
  console.log('Recent in-app notifications:', notifications.length);
  notifications.forEach(n => console.log('-', n.title, '|', n.user_id, '| read:', n.read));
  process.exit(0);
});
"
```

## API Endpoints

### Get In-App Notifications
```bash
GET /api/inapp/notifications?user_id=<user_id>&limit=50
```

### Get Unread Count
```bash
GET /api/inapp/unread-count?user_id=<user_id>
```

### Mark as Read
```bash
PUT /api/inapp/notifications/:id/read
Body: { "user_id": "<user_id>" }
```

### Mark All as Read
```bash
PUT /api/inapp/notifications/read-all
Body: { "user_id": "<user_id>" }
```

### Delete Notification
```bash
DELETE /api/inapp/notifications/:id?user_id=<user_id>
```

## Frontend Features

The frontend automatically:
- Polls for new notifications every 30 seconds
- Shows unread count badge on the bell icon
- Displays notifications in a slide-out panel
- Allows marking as read, marking all as read, and deleting notifications
- Shows notification time (e.g., "2m ago", "1h ago")

## Files Modified

1. **src/server.js**
   - Added in-app templates to default initialization
   - Added `trust proxy` setting for rate limiting

2. **src/scripts/add-inapp-template.js** (new)
   - Script to add user_signup in-app template

3. **src/scripts/add-all-inapp-templates.js** (new)
   - Script to add all in-app templates

4. **docs/guides/INAPP_NOTIFICATION_FIX.md** (new)
   - This documentation file

## Troubleshooting

### Notifications Not Appearing
1. Check that templates exist: `GET /api/templates`
2. Check that the user has the `inapp` channel enabled in preferences
3. Check the logs for any errors
4. Verify the notification was created: Check `InAppNotification` collection in MongoDB

### Badge Not Updating
1. Check browser console for API errors
2. Verify the polling interval is running (should see API calls every 30s)
3. Check that the user_id is correct in the API calls

### Template Not Found Error
1. Run the migration script: `node src/scripts/add-all-inapp-templates.js`
2. Verify templates exist in database
3. Check that the event_type matches exactly (case-sensitive)

## Next Steps

For production deployment:
1. The templates are now in the database, so they will persist
2. The updated `src/server.js` will initialize templates for new deployments
3. Consider adding more detailed in-app notification templates with rich content
4. Consider adding notification actions (e.g., "View Order", "Reset Password")
