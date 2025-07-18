# 🚂 LeadFi Railway Deployment Guide

## ✅ Pre-Deployment Checklist

### Files Created ✅
- [x] `Procfile` - Tells Railway how to start your app
- [x] `railway.toml` - Railway configuration and build instructions
- [x] Updated `run.py` - Production-ready Flask configuration
- [x] Updated `api.js` - Environment-based API URLs
- [x] React build works ✅ (tested successfully)

## 🚀 Step-by-Step Deployment

### 1. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (connects automatically to your code)

### 2. Deploy Your App
1. Click **"Deploy from GitHub repo"**
2. Select your **LeadFi** repository
3. Railway will automatically:
   - Detect it's a Python + Node.js project
   - Install dependencies from `requirements.txt`
   - Build React frontend with `npm run build`
   - Start your app with `python run.py`

### 3. Add PostgreSQL Database
1. In Railway dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway creates database automatically

### 4. Configure Environment Variables
Click your **Web Service** → **"Variables"** tab:

```bash
# Database (get from PostgreSQL service "Connect" tab)
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=<get-from-railway>

# App Settings
FLASK_ENV=production
LOG_LEVEL=INFO
PORT=8080
```

**🔍 How to get database credentials:**
1. Click **PostgreSQL** service
2. Go to **"Connect"** tab
3. Copy individual values (host, user, password)

### 5. Setup Database Schema
1. In **PostgreSQL** service → **"Data"** tab
2. Click **"Query"**
3. Copy content from `db/init.sql`
4. Click **"Run"** to create tables

### 6. Deploy & Test
1. Railway auto-deploys when you push to GitHub
2. Check **"Deployments"** tab for build status
3. Visit your app URL (Railway provides this)
4. Test: `your-app.railway.app/api/health` should return:
   ```json
   {
     "status": "healthy",
     "message": "LeadFi API is running"
   }
   ```

## 🔧 Troubleshooting

### Common Issues & Solutions

**❌ "Build failed"**
- Check **"Deployments"** → click failed deployment → read logs
- Usually missing dependencies or environment variables

**❌ "Database connection failed"**
- Verify all `DB_*` environment variables are set correctly
- Check PostgreSQL service is running

**❌ "Frontend not loading"**
- Ensure `npm run build` completed successfully
- Check browser developer tools for errors

**❌ "API calls failing"**
- Verify health check: `/api/health`
- Check environment variables are set
- Look at Railway service logs

### 📊 Monitoring Your App

**Health Check:** `your-app.railway.app/api/health`
**App Logs:** Railway Dashboard → Your Service → "Logs" tab
**Database:** Railway Dashboard → PostgreSQL → "Metrics" tab

## 💰 Cost Management

### Railway Free Tier
- **$5 free credits** per month
- **500 hours** of usage included
- Perfect for MVP and demos

### Estimated Usage (LeadFi)
- **Web Service:** ~$2-3/month
- **PostgreSQL:** ~$1-2/month
- **Total:** ~$3-5/month (within free tier)

## 🎯 Next Steps After Deployment

1. **Test all features** on live URL
2. **Share demo URL** with potential employers
3. **Monitor performance** via Railway dashboard
4. **Consider custom domain** (optional, $5/month)

## 📞 Support

**Railway Docs:** [docs.railway.app](https://docs.railway.app)
**Railway Discord:** Active community for help
**GitHub Issues:** For app-specific problems

---

**🎉 Once deployed, your LeadFi CRM will be accessible worldwide at a professional URL!**

**Perfect for:**
- Job interviews and demos
- Portfolio showcase
- Client presentations
- Proof of concept for employers 