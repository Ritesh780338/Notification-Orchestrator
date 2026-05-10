# 🚀 Quick Deployment Steps

## ⚡ Fast Track to Production

Follow these steps in order:

---

## Step 1: Deploy Backend to Render (15 minutes)

### 1.1 Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 1.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** `notification-orchestrator` (or your choice)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Instance Type:** Free

### 1.3 Add Environment Variables

Click "Environment" tab and add these (MINIMUM REQUIRED):

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRY=24h
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=noreply@yourapp.com
```

### 1.4 Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- **COPY YOUR RENDER URL:** `https://YOUR-APP-NAME.onrender.com`

### 1.5 Test Backend
Visit: `https://YOUR-APP-NAME.onrender.com/health`

Should see:
```json
{"status":"healthy","timestamp":"...","uptime":123,"database":"MongoDB"}
```

✅ **Backend is ready!**

---

## Step 2: Configure Frontend (2 minutes)

### 2.1 Update config.js

Open `public/js/config.js` and replace:

```javascript
const PRODUCTION_API_URL = 'https://YOUR-RENDER-APP-NAME.onrender.com/api';
```

With your actual Render URL:

```javascript
const PRODUCTION_API_URL = 'https://notification-orchestrator-abc123.onrender.com/api';
```

**IMPORTANT:** Don't forget the `/api` at the end!

### 2.2 Commit Changes

```bash
git add public/js/config.js
git commit -m "Configure production API URL"
git push
```

---

## Step 3: Deploy Frontend to Netlify (5 minutes)

### Option A: Drag & Drop (Easiest)

1. Go to https://app.netlify.com
2. Sign up/login
3. Drag the `public` folder to Netlify
4. Done! Note your URL: `https://YOUR-SITE.netlify.app`

### Option B: GitHub Integration (Recommended)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your repository
5. Configure:
   - **Base directory:** (leave empty)
   - **Build command:** (leave empty)
   - **Publish directory:** `public`
6. Click "Deploy site"
7. Note your URL: `https://YOUR-SITE.netlify.app`

✅ **Frontend is deployed!**

---

## Step 4: Test Everything (5 minutes)

### 4.1 Open Your Netlify Site
Visit: `https://YOUR-SITE.netlify.app`

### 4.2 Check Browser Console (F12)
Should see:
```
=== API Configuration ===
[Config] Environment: Production
[Config] API Base URL: https://your-app.onrender.com/api
========================
```

### 4.3 Check API Status
Top right corner should show: **"API Connected"** (green dot)

### 4.4 Test Registration
1. Click "Register here"
2. Fill in details
3. Click "Register"
4. Should redirect to dashboard

### 4.5 Test Sending Notification
1. Go to "Send Notification" tab
2. Enter your username
3. Select event type
4. Click "Send Notification"
5. Check your email!

---

## 🎉 Success!

If all tests pass, your app is live!

- **Frontend:** `https://YOUR-SITE.netlify.app`
- **Backend:** `https://YOUR-APP.onrender.com`

---

## 🐛 Troubleshooting

### "API Offline" Error

**Check:**
1. Is backend URL correct in `config.js`?
2. Is backend running on Render?
3. Open browser console - what's the error?

**Fix:**
```javascript
// In public/js/config.js - make sure URL is correct
const PRODUCTION_API_URL = 'https://YOUR-ACTUAL-URL.onrender.com/api';
```

### CORS Error

**Error:** `Access to fetch blocked by CORS`

**Fix:** Backend CORS is already configured to allow `.netlify.app` domains. If you have a custom domain, add it to `src/server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-custom-domain.com'  // Add this
];
```

### MongoDB Connection Error

**Check Render logs:**
1. Go to Render dashboard
2. Click your service
3. Click "Logs"
4. Look for MongoDB errors

**Common fixes:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (should be `0.0.0.0/0`)
- Verify database user password

### Emails Not Sending

**Check:**
1. Gmail App Password enabled?
2. 2FA enabled on Gmail?
3. Check Render logs for SMTP errors

---

## 📝 MongoDB Setup (If Needed)

### Quick MongoDB Atlas Setup

1. Go to https://mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M0 Free)
4. Create database user:
   - Username: `notifyuser`
   - Password: (generate strong password)
5. Network Access → Add IP: `0.0.0.0/0`
6. Get connection string:
   ```
   mongodb+srv://notifyuser:PASSWORD@cluster0.xxxxx.mongodb.net/notification_orchestrator
   ```
7. Add to Render environment variables

---

## 📧 Gmail Setup (If Needed)

### Enable App Password

1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Search "App Passwords"
4. Generate password for "Mail"
5. Copy 16-character password
6. Add to Render as `SMTP_PASSWORD`

---

## 🔄 Updating Your App

### Update Backend
1. Push changes to GitHub
2. Render auto-deploys (if enabled)
3. Or click "Manual Deploy" in Render dashboard

### Update Frontend
1. Update `public/js/config.js` if needed
2. Push changes to GitHub
3. Netlify auto-deploys (if GitHub integration)
4. Or drag `public` folder again

---

## 💡 Pro Tips

1. **First Request Slow?**
   - Render free tier sleeps after 15 min
   - First request takes ~30 seconds
   - Use UptimeRobot to keep it awake

2. **Custom Domain?**
   - Netlify: Settings → Domain management
   - Update CORS in `src/server.js`

3. **Environment Variables Changed?**
   - Restart service in Render dashboard

4. **Check Logs:**
   - Render: Dashboard → Logs
   - Browser: F12 → Console

---

## ✅ Deployment Checklist

### Backend (Render)
- [ ] Service created
- [ ] Environment variables added
- [ ] Deployed successfully
- [ ] `/health` returns 200
- [ ] MongoDB connected

### Frontend (Netlify)
- [ ] `config.js` updated with Render URL
- [ ] Deployed successfully
- [ ] Can access login page
- [ ] Browser console shows correct API URL
- [ ] "API Connected" shows green

### Testing
- [ ] Can register new user
- [ ] Can login
- [ ] Can send notification
- [ ] Email arrives (if SMTP configured)

---

**Need help?** Check the full guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`

**Created by:** Ritesh Sharma (240410700085)
