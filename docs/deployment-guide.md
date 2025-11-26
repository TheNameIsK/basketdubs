# Basketdubs Deployment Guide

**Stack:**
- Frontend: Vercel (React + Vite)
- Backend: Render (Flask)
- Database: Supabase (PostgreSQL)
- Keep-Alive: UptimeRobot

---

## 📋 Pre-Deployment Checklist

### 1. Prepare Your Repository

```bash
# Make sure everything is committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Gather Your Credentials

You'll need:
- ✅ Supabase URL
- ✅ Supabase Publishable Key
- ✅ Supabase Secret Key
- ✅ Google OAuth Client ID
- ✅ Google OAuth Client Secret
- ✅ Balldontlie API Key
- ✅ Gemini API Key

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your `basketdubs` repository
3. Configure the service:

**Basic Settings:**
```
Name: basketdubs-api
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: backend
Runtime: Python 3
```

**Build & Deploy:**
```
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
```

**Instance Type:**
```
Free (0.1 CPU, 512 MB RAM)
```

### Step 3: Add Environment Variables

Click **"Environment"** and add these variables:

```env
FLASK_SECRET_KEY=bedejirsuksesgayawbroks9
SUPABASE_URL=https://lbbnyriwbstptwvhnvgq.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_NmVEKyCqKNvpUEgArTMsjQ_R4GN7Lrt
SUPABASE_SECRET_KEY=sb_secret_s3PROaFyDOM5JSMhrlLDqw_zN8F7200
BALLDONTLIE_API_KEY=fdc7912c-4bed-4a91-9c44-8cdfb2cbffb2
GEMINI_API_KEY=AIzaSyCNAtOIKPr3QxgFB2UqMNSHcDFOHx8_doI
GOOGLE_CLIENT_ID=156724908519-b2am740d7a6tqck6ajvio17lp9fh84fm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Your backend URL: `https://basketdubs-api.onrender.com`

### Step 5: Test Backend

```bash
# Test health endpoint
curl https://basketdubs-api.onrender.com/api/health

# Expected response:
{"status":"ok","message":"Basketdubs API is running"}
```

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Create Production Environment File

Create `frontend/.env.production`:

```env
VITE_API_URL=https://basketdubs-api.onrender.com
VITE_GOOGLE_CLIENT_ID=156724908519-b2am740d7a6tqck6ajvio17lp9fh84fm.apps.googleusercontent.com
VITE_SUPABASE_URL=https://lbbnyriwbstptwvhnvgq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NmVEKyCqKNvpUEgArTMsjQ_R4GN7Lrt
```

**Commit this file:**
```bash
git add frontend/.env.production
git commit -m "Add production environment"
git push
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

### Step 3: Import Project

1. Click **"Add New..." → "Project"**
2. Import your `basketdubs` repository
3. Configure:

**Framework Preset:**
```
Vite
```

**Root Directory:**
```
frontend
```

**Build Settings:**
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 4: Add Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables**:

```
VITE_API_URL=https://basketdubs-api.onrender.com
VITE_GOOGLE_CLIENT_ID=156724908519-b2am740d7a6tqck6ajvio17lp9fh84fm.apps.googleusercontent.com
VITE_SUPABASE_URL=https://lbbnyriwbstptwvhnvgq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NmVEKyCqKNvpUEgArTMsjQ_R4GN7Lrt
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. Your frontend URL: `https://basketdubs.vercel.app`

---

## 🔧 Part 3: Configure CORS

### Update Backend CORS Settings

Edit `backend/app.py`:

```python
from flask_cors import CORS

CORS(app, origins=[
    "http://localhost:5173",  # Local development
    "https://basketdubs.vercel.app",  # Production
    "https://*.vercel.app"  # Vercel preview deployments
])
```

**Commit and push:**
```bash
git add backend/app.py
git commit -m "Update CORS for production"
git push
```

Render will automatically redeploy.

---

## 🔄 Part 4: Setup UptimeRobot (Keep Backend Awake)

### Why UptimeRobot?

Render Free tier spins down after 15 minutes of inactivity. UptimeRobot pings your backend every 5 minutes to keep it awake.

### Step 1: Create UptimeRobot Account

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free account)
3. Verify email

### Step 2: Add Monitor

1. Click **"+ Add New Monitor"**
2. Configure:

```
Monitor Type: HTTP(s)
Friendly Name: Basketdubs API
URL: https://basketdubs-api.onrender.com/api/health
Monitoring Interval: 5 minutes
```

3. Click **"Create Monitor"**

### Step 3: Verify

- Monitor status should turn green within 5 minutes
- Your backend will now stay awake 24/7
- Cron job will run every 10 minutes continuously

---

## 🔐 Part 5: Update Google OAuth

### Add Production URLs to Google Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins:**
   ```
   https://basketdubs.vercel.app
   ```
4. Add to **Authorized redirect URIs:**
   ```
   https://lbbnyriwbstptwvhnvgq.supabase.co/auth/v1/callback
   ```
5. Click **Save**

### Update Supabase Auth Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update **Site URL:**
   ```
   https://basketdubs.vercel.app
   ```
3. Add to **Redirect URLs:**
   ```
   https://basketdubs.vercel.app/**
   https://basketdubs.vercel.app/court
   ```
4. Click **Save**

---

## ✅ Part 6: Testing Deployment

### Test Checklist

**Backend Tests:**
```bash
# Health check
curl https://basketdubs-api.onrender.com/api/health

# Games endpoint
curl https://basketdubs-api.onrender.com/api/games

# Expected: JSON with upcoming and recent games
```

**Frontend Tests:**
1. Visit `https://basketdubs.vercel.app`
2. Click "Sign in with Google"
3. Authenticate
4. Should redirect to `/court`
5. See today's games
6. Make a prediction
7. Check if prediction is saved

**Cron Job Test:**
```bash
# Manually trigger score updater
curl -X POST https://basketdubs-api.onrender.com/api/cron/trigger

# Check Render logs for output
```

---

## 📊 Part 7: Monitoring

### Render Dashboard

Monitor your backend:
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory usage
- **Events:** Deployments, restarts

**Watch for:**
- Cron job output every 10 minutes
- API request logs
- Error messages

### Vercel Dashboard

Monitor your frontend:
- **Deployments:** Build history
- **Analytics:** Page views, performance
- **Logs:** Function logs (if using serverless)

### UptimeRobot Dashboard

Monitor uptime:
- **Status:** Should be green (up)
- **Response Time:** Should be < 1000ms
- **Uptime %:** Should be 99%+

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: "Application failed to respond"**
```
Solution:
1. Check Render logs for errors
2. Verify environment variables are set
3. Check if port binding is correct (gunicorn uses $PORT)
```

**Problem: "CORS error"**
```
Solution:
1. Verify CORS origins in app.py
2. Make sure Vercel URL is included
3. Redeploy backend after changes
```

**Problem: "Cron job not running"**
```
Solution:
1. Check Render logs for "Cron job scheduler started"
2. Verify APScheduler is installed
3. Check if UptimeRobot is pinging correctly
```

### Frontend Issues

**Problem: "Failed to fetch games"**
```
Solution:
1. Check if VITE_API_URL is correct
2. Verify backend is running
3. Check browser console for CORS errors
```

**Problem: "Google OAuth not working"**
```
Solution:
1. Verify redirect URIs in Google Console
2. Check Supabase auth settings
3. Make sure VITE_GOOGLE_CLIENT_ID is correct
```

### Cache Issues

**Problem: "Games not updating"**
```
Solution:
1. Clear cache: POST /api/games/clear-cache
2. Wait 6 hours for automatic refresh
3. Check if balldontlie API is working
```

---

## 🔄 Updating Your App

### Backend Updates

```bash
# Make changes
git add backend/
git commit -m "Update backend"
git push

# Render auto-deploys from main branch
# Check deployment in Render dashboard
```

### Frontend Updates

```bash
# Make changes
git add frontend/
git commit -m "Update frontend"
git push

# Vercel auto-deploys from main branch
# Check deployment in Vercel dashboard
```

---

## 💰 Cost Breakdown

### Free Tier (Current Setup)

```
Frontend (Vercel):        $0/month
Backend (Render):         $0/month
Database (Supabase):      $0/month
UptimeRobot:              $0/month
Domain (optional):        $12/year

Total: $0/month (or $1/month for domain)
```

### Limitations

- Backend: 750 hours/month (enough for 24/7 with UptimeRobot)
- Database: 500MB storage, 2GB bandwidth
- Frontend: Unlimited bandwidth
- UptimeRobot: 50 monitors, 5-minute intervals

### Paid Upgrade Path

When you outgrow free tier:

```
Render Starter:           $7/month (no sleep, better performance)
Supabase Pro:             $25/month (8GB storage, better support)
Vercel Pro:               $20/month (better analytics, team features)

Total: ~$50/month for production-ready setup
```

---

## 🎉 Deployment Complete!

Your app is now live at:
- **Frontend:** https://basketdubs.vercel.app
- **Backend:** https://basketdubs-api.onrender.com

**What's Running:**
- ✅ Users can sign in with Google
- ✅ Users can make predictions
- ✅ Cron job updates scores every 10 minutes
- ✅ Points are awarded automatically
- ✅ Backend stays awake 24/7
- ✅ Frontend is blazing fast on CDN

**Next Steps:**
1. Share your app with friends
2. Monitor logs for issues
3. Collect feedback
4. Iterate and improve!

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [UptimeRobot Documentation](https://uptimerobot.com/help)

---

**Need Help?**
- Check Render logs for backend issues
- Check Vercel logs for frontend issues
- Check browser console for client-side errors
- Review this guide for common solutions

Good luck with your deployment! 🚀🏀
