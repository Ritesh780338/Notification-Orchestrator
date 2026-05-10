# 🚀 Production Deployment Guide

## Complete Guide for Deploying to Netlify (Frontend) + Render (Backend)

---

## 📋 Overview

Your application is split into:
- **Frontend**: Static HTML/CSS/JS files → Deploy to **Netlify**
- **Backend**: Node.js Express API → Deploy to **Render**

The issue you're facing is that the frontend doesn't know the backend URL in production.

---

## 🔧 Part 1: Fix Frontend Configuration

### Step 1: Create Environment-Aware Configuration

The frontend currently uses `const API_BASE = '/api'` which only works when both are on the same domain. We need to make it dynamic.

**File: `public/js/config.js`** (NEW FILE - will be created)

```javascript
// Auto-detect API base URL based on environment
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'  // Local development
  : 'https://YOUR-RENDER-APP-NAME.onrender.com/api';  // Production

console.log('[Config] API Base URL:', API_BASE);
console.log('[Config] Current hostname:', window.location.hostname);
```

### Step 2: Update HTML Files

Add the config script BEFORE app.js in both `public/index.html` and `public/login.html`:

```html
<!-- Add this line BEFORE app.js -->
<script src="/js/config.js"></script>
<script src="/js/app.js"></script>
```

---

## 🎯 Part 2: Backend Deployment on Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Click "New +" → "Web Service"

### Step 2: Connect Repository
1. Connect your GitHub repository
2. Render will auto-detect it's a Node.js app

### Step 3: Configure Build Settings

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node src/server.js
```

**Environment:** `Node`

### Step 4: Add Environment Variables

In Render dashboard, go to "Environment" tab and add these variables:

```env
NODE_ENV=production
PORT=10000

# MongoDB - REQUIRED
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification_orchestrator

# JWT - REQUIRED
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=24h

# Email Configuration - REQUIRED for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=noreply@yourapp.com

# Redis - OPTIONAL (Render provides free Redis)
REDIS_HOST=your-redis-host.render.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# SMS Provider - OPTIONAL
SMS_PROVIDER=mock
SMS_API_KEY=your_sms_api_key

# Push Notifications - OPTIONAL
PUSH_PROVIDER=mock
FCM_SERVER_KEY=your_fcm_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_MS=1000

# Quiet Hours
QUIET_HOURS_START=22
QUIET_HOURS_END=7
```

### Step 5: Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://YOUR-APP-NAME.onrender.com`

### Step 6: Test Backend
Visit: `https://YOUR-APP-NAME.onrender.com/health`

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": 123,
  "database": "MongoDB"
}
```

---

## 🌐 Part 3: Frontend Deployment on Netlify

### Step 1: Update Frontend Configuration

**IMPORTANT:** Before deploying, update `public/js/config.js` with your actual Render URL:

```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://YOUR-ACTUAL-RENDER-APP-NAME.onrender.com/api';
```

Replace `YOUR-ACTUAL-RENDER-APP-NAME` with your actual Render app name!

### Step 2: Create Netlify Configuration

**File: `netlify.toml`** (create in root directory)

```toml
[build]
  publish = "public"
  command = "echo 'No build needed - static site'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 3: Deploy to Netlify

**Option A: Drag & Drop (Easiest)**
1. Go to https://app.netlify.com
2. Drag the `public` folder to Netlify
3. Done!

**Option B: GitHub Integration (Recommended)**
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your repository
5. Build settings:
   - **Base directory:** (leave empty)
   - **Build command:** (leave empty)
   - **Publish directory:** `public`
6. Click "Deploy site"

### Step 4: Configure CORS on Backend

Your backend needs to allow requests from Netlify. Update `src/server.js`:

```javascript
// Replace this line:
app.use(cors());

// With this:
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://YOUR-NETLIFY-SITE.netlify.app',  // Add your Netlify URL
    'https://YOUR-CUSTOM-DOMAIN.com'  // If you have a custom domain
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## 🔐 Part 4: MongoDB Setup (If Not Done)

### Option 1: MongoDB Atlas (Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (M0 Free tier)
4. Create database user:
   - Username: `notifyuser`
   - Password: (generate strong password)
5. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
6. Get connection string:
   ```
   mongodb+srv://notifyuser:PASSWORD@cluster0.xxxxx.mongodb.net/notification_orchestrator
   ```
7. Add to Render environment variables as `MONGODB_URI`

---

## 📧 Part 5: Email Setup (Gmail)

### Enable Gmail App Password

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to "App Passwords"
4. Generate password for "Mail"
5. Use this password in `SMTP_PASSWORD` environment variable

**Environment Variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM=noreply@yourapp.com
```

---

## ✅ Part 6: Testing Production Setup

### 1. Test Backend Health
```bash
curl https://YOUR-APP.onrender.com/health
```

### 2. Test Backend API
```bash
curl https://YOUR-APP.onrender.com/api
```

### 3. Test Frontend
1. Visit your Netlify URL
2. Open browser console (F12)
3. Look for: `[Config] API Base URL: https://...`
4. Try to login/register

### 4. Test Full Flow
1. Register a new user
2. Login
3. Send a notification
4. Check if email arrives

---

## 🐛 Troubleshooting

### Issue: "API Offline" in Frontend

**Check:**
1. Is backend URL correct in `config.js`?
2. Is backend actually running on Render?
3. Open browser console - what's the error?
4. Check CORS configuration

**Fix:**
```javascript
// In public/js/config.js
const API_BASE = 'https://YOUR-ACTUAL-RENDER-URL.onrender.com/api';
```

### Issue: CORS Error

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS`

**Fix:** Update `src/server.js` CORS configuration to include your Netlify URL

### Issue: MongoDB Connection Failed

**Check:**
1. Is `MONGODB_URI` set in Render environment variables?
2. Is IP whitelist set to `0.0.0.0/0`?
3. Is password correct (no special characters that need encoding)?

### Issue: Emails Not Sending

**Check:**
1. Gmail App Password enabled?
2. 2FA enabled on Gmail?
3. Check Render logs for SMTP errors

### Issue: 404 on Netlify Routes

**Fix:** Ensure `netlify.toml` has the redirect rule for SPA routing

---

## 📝 Quick Checklist

### Backend (Render)
- [ ] Repository connected
- [ ] Environment variables added (especially `MONGODB_URI`, `JWT_SECRET`)
- [ ] Build command: `npm install`
- [ ] Start command: `node src/server.js`
- [ ] Deployed successfully
- [ ] `/health` endpoint returns 200
- [ ] CORS configured with Netlify URL

### Frontend (Netlify)
- [ ] `config.js` created with correct Render URL
- [ ] `config.js` imported in `index.html` and `login.html`
- [ ] `netlify.toml` created
- [ ] Publish directory set to `public`
- [ ] Deployed successfully
- [ ] Can access login page
- [ ] Browser console shows correct API URL

### Database
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured
- [ ] Connection string added to Render

### Email (Optional)
- [ ] Gmail App Password generated
- [ ] SMTP credentials added to Render

---

## 🎉 Success Criteria

When everything is working:

1. ✅ Visit Netlify URL → See login page
2. ✅ Browser console shows: `[Config] API Base URL: https://your-app.onrender.com/api`
3. ✅ Top right shows: "API Connected" (green)
4. ✅ Can register new user
5. ✅ Can login
6. ✅ Can send notification
7. ✅ Email arrives in inbox

---

## 🔗 Important URLs

- **Render Dashboard:** https://dashboard.render.com
- **Netlify Dashboard:** https://app.netlify.com
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Your Backend:** `https://YOUR-APP.onrender.com`
- **Your Frontend:** `https://YOUR-SITE.netlify.app`

---

## 💡 Pro Tips

1. **Free Tier Limitations:**
   - Render free tier: Backend sleeps after 15 min inactivity (first request takes ~30s)
   - MongoDB Atlas: 512MB storage limit
   - Netlify: 100GB bandwidth/month

2. **Keep Backend Awake:**
   - Use a service like UptimeRobot to ping your backend every 5 minutes
   - Or upgrade to Render paid plan ($7/month)

3. **Custom Domain:**
   - Netlify: Settings → Domain management → Add custom domain
   - Update CORS in backend with new domain

4. **Environment Variables:**
   - Never commit `.env` file
   - Always use Render's environment variables UI
   - Restart service after changing env vars

---

## 📞 Need Help?

If you're still stuck:

1. Check Render logs: Dashboard → Your Service → Logs
2. Check browser console (F12) for frontend errors
3. Test backend directly with curl/Postman
4. Verify all environment variables are set correctly

---

**Created by:** Ritesh Sharma (240410700085)
**Last Updated:** May 2026
