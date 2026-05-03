# Quick Deploy Checklist ⚡

## 🚀 Deploy in 10 Minutes (Render - Recommended)

### Step 1: Setup MongoDB Atlas (3 minutes)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create Free Cluster (M0)
3. Create Database User
4. Network Access → Add IP: `0.0.0.0/0`
5. Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/notification_orchestrator
   ```

### Step 2: Deploy to Render (5 minutes)
1. Go to https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect repository: `Ritesh780338/Notification-Orchestrator`
5. Configure:
   ```
   Name: notification-orchestrator
   Build Command: npm install
   Start Command: npm start
   ```

### Step 3: Add Environment Variables (2 minutes)
Click "Environment" and add these:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification_orchestrator
REDIS_HOST=redis-17413.crce182.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=17413
REDIS_PASSWORD=RqEhFitk4zDZ25aaZWS1epGR9jwoB2JB
REDIS_USERNAME=default
JWT_SECRET=bfhjsbigbdfibgihihfbgdfgeofjoefeigfgiehfioehrg
JWT_EXPIRY=24h
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Deploy! 🎉
- Click **"Create Web Service"**
- Wait 5-10 minutes
- Your app will be live at: `https://notification-orchestrator.onrender.com`

---

## ✅ Post-Deployment Test

```bash
# Test health endpoint
curl https://your-app-url.onrender.com/health

# Test notification API
curl -X POST https://your-app-url.onrender.com/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "event_type": "user_signup",
    "priority": "normal",
    "metadata": {"first_name": "Test"}
  }'
```

---

## 🎯 Alternative: Railway (Even Easier!)

1. Go to https://railway.app
2. Sign up with GitHub
3. **"New Project"** → **"Deploy from GitHub"**
4. Select your repository
5. Add environment variables (same as above)
6. Click **"Deploy"**
7. Generate domain → Done! 🚀

---

## 📱 Access Your App

**Frontend Dashboard**: `https://your-app-url.com`

**API Base**: `https://your-app-url.com/api`

**Health Check**: `https://your-app-url.com/health`

---

## 🐛 Common Issues

**Issue**: App crashes on startup
- **Fix**: Check logs, verify MongoDB connection string

**Issue**: Can't connect to MongoDB
- **Fix**: Add `0.0.0.0/0` to IP whitelist in MongoDB Atlas

**Issue**: Redis connection failed
- **Fix**: Verify Redis credentials in environment variables

---

## 💡 Pro Tips

1. **Free Tier Limits**:
   - Render: 750 hours/month (enough for 1 app)
   - Railway: $5 credit/month
   - MongoDB Atlas: 512MB storage (plenty for testing)

2. **Auto-Deploy**:
   - Both Render and Railway auto-deploy when you push to GitHub
   - Just `git push` and your changes go live!

3. **Monitoring**:
   - Check logs in platform dashboard
   - Set up email alerts for crashes

---

## 🎓 For Students

Get free credits:
- **GitHub Student Pack**: https://education.github.com/pack
- **DigitalOcean**: $200 credit
- **Heroku**: Student credits

---

**That's it!** Your Notification Orchestrator is now live and accessible worldwide! 🌍

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.
