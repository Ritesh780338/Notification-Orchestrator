# Deployment Guide - Notification Orchestrator

Complete guide to deploy your Notification Orchestrator to various platforms.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
   - [Render (Recommended - Free)](#option-1-render-recommended---free)
   - [Railway (Easy - Free Tier)](#option-2-railway-easy---free-tier)
   - [Heroku (Popular)](#option-3-heroku-popular)
   - [Vercel (Frontend + Serverless)](#option-4-vercel-frontend--serverless)
   - [DigitalOcean (VPS)](#option-5-digitalocean-vps)
4. [Database Setup](#database-setup)
5. [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying, ensure you have:
- ✅ GitHub account with your repository
- ✅ MongoDB Atlas account (free tier available)
- ✅ Redis Cloud account (free tier available)
- ✅ Project pushed to GitHub

---

## Environment Setup

### 1. MongoDB Atlas Setup (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/notification_orchestrator
   ```

### 2. Redis Cloud Setup (Free)

You already have Redis configured in your `.env`:
```
REDIS_HOST=redis-17413.crce182.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=17413
REDIS_PASSWORD=RqEhFitk4zDZ25aaZWS1epGR9jwoB2JB
```

Or create a new one at [Redis Cloud](https://redis.com/try-free/)

---

## Deployment Options

## Option 1: Render (Recommended - Free)

### Why Render?
- ✅ Free tier available
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Auto-deploy on git push
- ✅ Built-in environment variables

### Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `Ritesh780338/Notification-Orchestrator`

3. **Configure Service**
   ```
   Name: notification-orchestrator
   Region: Singapore (or closest to you)
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**
   Click "Environment" and add:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification_orchestrator
   REDIS_HOST=redis-17413.crce182.ap-south-1-1.ec2.cloud.redislabs.com
   REDIS_PORT=17413
   REDIS_PASSWORD=RqEhFitk4zDZ25aaZWS1epGR9jwoB2JB
   REDIS_USERNAME=default
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRY=24h
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM=noreply@notificationorchestrator.com
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_RETRY_ATTEMPTS=3
   RETRY_BACKOFF_MS=1000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your app will be live at: `https://notification-orchestrator.onrender.com`

---

## Option 2: Railway (Easy - Free Tier)

### Why Railway?
- ✅ $5 free credit monthly
- ✅ Very easy setup
- ✅ Great for Node.js apps
- ✅ Auto-deploy from GitHub

### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Ritesh780338/Notification-Orchestrator`

3. **Add Environment Variables**
   - Click on your service
   - Go to "Variables" tab
   - Add all environment variables (same as Render above)

4. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Your app will be live at: `https://notification-orchestrator.up.railway.app`

---

## Option 3: Heroku (Popular)

### Why Heroku?
- ✅ Well-established platform
- ✅ Easy to use
- ✅ Good documentation

### Steps:

1. **Install Heroku CLI**
   ```bash
   # Windows (using npm)
   npm install -g heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create notification-orchestrator-ritesh
   ```

4. **Add Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="your_mongodb_uri"
   heroku config:set REDIS_HOST="redis-17413.crce182.ap-south-1-1.ec2.cloud.redislabs.com"
   heroku config:set REDIS_PORT=17413
   heroku config:set REDIS_PASSWORD="RqEhFitk4zDZ25aaZWS1epGR9jwoB2JB"
   heroku config:set REDIS_USERNAME="default"
   heroku config:set JWT_SECRET="your_secret_key"
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   ```

---

## Option 4: Vercel (Frontend + Serverless)

### Why Vercel?
- ✅ Free tier
- ✅ Great for frontend
- ✅ Serverless functions support

### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all variables

---

## Option 5: DigitalOcean (VPS)

### Why DigitalOcean?
- ✅ Full control
- ✅ $200 free credit for students
- ✅ Scalable

### Steps:

1. **Create Droplet**
   - Go to [DigitalOcean](https://www.digitalocean.com)
   - Create a Droplet (Ubuntu 22.04)
   - Choose $6/month plan

2. **SSH into Server**
   ```bash
   ssh root@your_server_ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2**
   ```bash
   npm install -g pm2
   ```

5. **Clone Repository**
   ```bash
   git clone https://github.com/Ritesh780338/Notification-Orchestrator.git
   cd Notification-Orchestrator
   ```

6. **Install Dependencies**
   ```bash
   npm install
   ```

7. **Create .env File**
   ```bash
   nano .env
   # Paste your environment variables
   # Press Ctrl+X, then Y, then Enter to save
   ```

8. **Start with PM2**
   ```bash
   pm2 start src/server.js --name notification-orchestrator
   pm2 save
   pm2 startup
   ```

9. **Setup Nginx (Optional)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/notification-orchestrator
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/notification-orchestrator /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Database Setup

### MongoDB Atlas (Required)

1. **Whitelist IP Addresses**
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add IP Address
   - For deployment platforms, add `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs from your hosting provider

2. **Create Database User**
   - Database Access → Add New Database User
   - Username: `notif_user`
   - Password: Generate secure password
   - Database User Privileges: Read and write to any database

3. **Get Connection String**
   ```
   mongodb+srv://notif_user:password@cluster.mongodb.net/notification_orchestrator?retryWrites=true&w=majority
   ```

---

## Post-Deployment

### 1. Test Your Deployment

```bash
# Health check
curl https://your-app-url.com/health

# Test API
curl -X POST https://your-app-url.com/api/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "event_type": "user_signup",
    "priority": "normal",
    "metadata": {"first_name": "Test"}
  }'
```

### 2. Monitor Your App

**Render:**
- Dashboard → Logs
- Dashboard → Metrics

**Railway:**
- Project → Deployments → Logs

**Heroku:**
```bash
heroku logs --tail
```

**DigitalOcean:**
```bash
pm2 logs notification-orchestrator
pm2 monit
```

### 3. Setup Custom Domain (Optional)

**Render:**
- Settings → Custom Domain → Add your domain
- Update DNS records as instructed

**Railway:**
- Settings → Domains → Add custom domain

**Heroku:**
```bash
heroku domains:add www.yourdomain.com
```

### 4. Enable HTTPS

Most platforms (Render, Railway, Vercel) provide automatic HTTPS.

For DigitalOcean with Nginx:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables Checklist

Make sure these are set in your deployment platform:

```env
✅ NODE_ENV=production
✅ PORT=3000
✅ MONGODB_URI=your_mongodb_connection_string
✅ REDIS_HOST=your_redis_host
✅ REDIS_PORT=your_redis_port
✅ REDIS_PASSWORD=your_redis_password
✅ REDIS_USERNAME=default
✅ JWT_SECRET=your_secret_key
✅ JWT_EXPIRY=24h
✅ SMTP_HOST=smtp.gmail.com
✅ SMTP_PORT=587
✅ SMTP_USER=your_email
✅ SMTP_PASSWORD=your_app_password
✅ SMTP_FROM=noreply@yourdomain.com
✅ RATE_LIMIT_WINDOW_MS=60000
✅ RATE_LIMIT_MAX_REQUESTS=100
✅ MAX_RETRY_ATTEMPTS=3
✅ RETRY_BACKOFF_MS=1000
```

---

## Troubleshooting

### App Won't Start
- Check logs for errors
- Verify all environment variables are set
- Ensure MongoDB and Redis are accessible

### Database Connection Failed
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Test connection string locally first

### Redis Connection Failed
- Verify Redis credentials
- Check if Redis host is accessible
- Try pinging Redis host

### Port Issues
- Most platforms set PORT automatically
- Don't hardcode port 3000 in production
- Use `process.env.PORT || 3000`

---

## Recommended: Render Deployment (Step-by-Step)

### Quick Start with Render:

1. **Go to Render**: https://render.com
2. **Sign up** with GitHub
3. **New Web Service** → Connect GitHub repo
4. **Configure**:
   - Name: `notification-orchestrator`
   - Build: `npm install`
   - Start: `npm start`
5. **Add Environment Variables** (copy from above)
6. **Deploy** → Wait 5-10 minutes
7. **Done!** Your app is live 🎉

**Your Live URL**: `https://notification-orchestrator.onrender.com`

---

## Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Render** | ✅ Yes (750 hrs/month) | $7/month | Beginners |
| **Railway** | ✅ $5 credit/month | $5/month | Easy setup |
| **Heroku** | ❌ No (was free) | $7/month | Established |
| **Vercel** | ✅ Yes | $20/month | Frontend-heavy |
| **DigitalOcean** | ❌ No | $6/month | Full control |

---

## 🎓 Student Benefits

- **GitHub Student Pack**: Free credits for many platforms
- **DigitalOcean**: $200 credit
- **Heroku**: Student credits available
- **MongoDB Atlas**: Free M0 cluster forever

Apply at: https://education.github.com/pack

---

## Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Monitor logs for errors
3. ✅ Set up custom domain (optional)
4. ✅ Enable monitoring/alerts
5. ✅ Share your live URL!

---

## 📞 Support

If you encounter issues:
1. Check platform-specific logs
2. Verify environment variables
3. Test MongoDB/Redis connections
4. Review deployment platform documentation

---

**Congratulations!** 🎉 Your Notification Orchestrator is now deployed and accessible worldwide!

**Project by**: Ritesh Sharma (240410700085)
