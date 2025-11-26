# Deployment Checklist

Quick reference for deploying Basketdubs to production.

---

## ☑️ Pre-Deployment

- [ ] All code committed and pushed to GitHub
- [ ] `.env.production` created in frontend folder
- [ ] All API keys and credentials ready
- [ ] Supabase database schema applied
- [ ] Google OAuth credentials configured

---

## ☑️ Backend (Render)

- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
- [ ] Add all environment variables
- [ ] Deploy and wait for completion
- [ ] Test `/api/health` endpoint
- [ ] Copy backend URL for frontend

---

## ☑️ Frontend (Vercel)

- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Set framework preset to Vite
- [ ] Add environment variables (including backend URL)
- [ ] Deploy and wait for completion
- [ ] Test frontend loads correctly
- [ ] Copy frontend URL for OAuth config

---

## ☑️ CORS Configuration

- [ ] Update `backend/app.py` with Vercel URL
- [ ] Commit and push changes
- [ ] Wait for Render auto-deploy
- [ ] Test API calls from frontend

---

## ☑️ UptimeRobot

- [ ] Create UptimeRobot account
- [ ] Add new HTTP(s) monitor
- [ ] Set URL to backend `/api/health`
- [ ] Set interval to 5 minutes
- [ ] Verify monitor is green
- [ ] Backend stays awake!

---

## ☑️ Google OAuth

- [ ] Add Vercel URL to Authorized JavaScript origins
- [ ] Verify Supabase callback URL in Authorized redirect URIs
- [ ] Save changes in Google Console

---

## ☑️ Supabase Configuration

- [ ] Update Site URL to Vercel URL
- [ ] Add Vercel URL to Redirect URLs
- [ ] Save changes

---

## ☑️ Final Testing

- [ ] Visit production frontend URL
- [ ] Sign in with Google
- [ ] View today's games
- [ ] Make a prediction
- [ ] Cancel a prediction
- [ ] Check if prediction persists after refresh
- [ ] Wait 10 minutes and check Render logs for cron job
- [ ] Manually trigger cron: `POST /api/cron/trigger`
- [ ] Verify points are awarded correctly

---

## ☑️ Monitoring Setup

- [ ] Bookmark Render dashboard
- [ ] Bookmark Vercel dashboard
- [ ] Bookmark UptimeRobot dashboard
- [ ] Set up email alerts in UptimeRobot (optional)
- [ ] Check logs daily for first week

---

## 🎉 Deployment Complete!

**Your URLs:**
- Frontend: `https://basketdubs.vercel.app`
- Backend: `https://basketdubs-api.onrender.com`

**Share with friends and start collecting predictions!** 🏀
