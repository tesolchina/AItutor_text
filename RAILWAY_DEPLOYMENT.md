# Railway Deployment Guide - ByteWise Frontend

**Date**: September 5, 2025  
**Deployment Target**: https://avatartutor.hkbu.tech/  
**Domain Provider**: Alibaba Cloud (cn.aliyun.com)  
**Status**: Ready for Deployment  

## 🚀 Deployment Summary

This document outlines the Railway deployment configuration for the ByteWise frontend application, addressing the deployment difficulties you encountered.

## 📋 Pre-Deployment Checklist

### ✅ Files Added/Modified:
- `railway.toml` - Railway-specific configuration
- `.env.production` - Production environment variables
- `package.json` - Updated with Railway build scripts and serve dependency
- `src/components/base_url.js` - Environment-aware API URL configuration

### ✅ Configuration Summary:
- **Build Command**: `npm run railway:build` (runs `vite build`)
- **Start Command**: `npm run railway:start` (serves static files from `dist/`)
- **Port**: Uses `$PORT` environment variable (Railway standard)
- **Health Check**: Root path `/` with 300s timeout
- **Build Tool**: Nixpacks (Railway's automatic builder)

## 🛠 Railway Deployment Steps

### Step 1: Create New Railway Project
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### Step 2: Connect Repository
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository: `Bob8259/new-bytewise-frontend`
5. Select the `main` branch

### Step 3: Configure Environment Variables
Set these in Railway dashboard under "Variables":
```
NODE_ENV=production
VITE_APP_TITLE=ByteWise Avatar Tutor
VITE_APP_DOMAIN=https://avatartutor.hkbu.tech
VITE_API_BASE_URL=https://new-bytewise-backend-production-8c33.up.railway.app/api
```

### Step 4: Custom Domain Setup
1. In Railway dashboard, go to your project
2. Click on "Settings" → "Domains"
3. Add custom domain: `avatartutor.hkbu.tech`
4. Copy the CNAME record provided by Railway

### Step 5: Configure DNS (Alibaba Cloud)
1. Login to Alibaba Cloud console (cn.aliyun.com)
2. Go to Domain Management
3. Add CNAME record:
   - **Host**: `avatartutor`
   - **Type**: `CNAME`
   - **Value**: `[railway-generated-domain]` (from step 4)
   - **TTL**: `600`

## 🔧 Technical Details

### Build Process
1. **Build Phase**: Railway runs `npm install` then `npm run railway:build`
   - Installs all dependencies including `serve`
   - Runs `vite build` to generate static files in `dist/` folder
   
2. **Runtime Phase**: Railway starts with `npm run railway:start`
   - Uses `serve` package to host static files from `dist/`
   - Serves on port specified by `$PORT` environment variable
   - Includes SPA routing support via `serve.json` configuration

### Key Configuration Files

#### `railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

#### Updated `package.json` Scripts
```json
{
  "railway:build": "npm run build",
  "railway:start": "serve -s dist -p $PORT"
}
```

## 🌐 Application Features

### Core Functionality
- **Multi-Bot Chat System**: Text-based conversations with various AI assistants
- **Avatar Mode**: Voice-enabled chat with microphone input and speech-to-text
- **Report Generation**: PDF/Markdown export with email functionality
- **Token Tracking**: Real-time usage monitoring with HKBU quota integration
- **Responsive UI**: Modern design with Tailwind CSS

### Technical Stack
- **Frontend**: Vue 3 + Vite + Pinia + Vue Router
- **Styling**: Tailwind CSS v4
- **Audio**: MediaRecorder API + WebSocket streaming
- **Build Tool**: Vite (fast HMR in development, optimized production builds)

## 🔍 Troubleshooting Previous Issues

### Issues You Encountered:
1. **Missing Railway Configuration** ✅ Fixed
   - Added `railway.toml` for proper Railway integration
   - Configured health checks and restart policies

2. **Static Site Dependencies** ✅ Fixed
   - Moved `serve` to devDependencies (it gets installed in production)
   - Added explicit Railway build/start commands

3. **Environment Configuration** ✅ Fixed
   - Created environment-aware base URL configuration
   - Added production environment variables

4. **Build Process** ✅ Fixed
   - Defined clear build and start commands for Railway
   - Ensured proper static file serving with SPA support

## 🎯 Post-Deployment Verification

### Test Checklist:
- [ ] Homepage loads at https://avatartutor.hkbu.tech/
- [ ] Bot selection works correctly
- [ ] Chat interface loads without errors
- [ ] API connectivity to backend confirmed
- [ ] Avatar mode microphone permissions work
- [ ] Report generation and download functions
- [ ] Email functionality operational
- [ ] Mobile responsive design verified

### Expected Behavior:
1. **Home Page**: Gradient interface with bot selection
2. **Chat Mode**: Text conversations with token tracking
3. **Avatar Mode**: Voice conversations with speech-to-text
4. **Reports**: Generation, PDF/Markdown export, email sending

## 📞 Support Information

### If Issues Arise:
1. **Railway Logs**: Check deployment logs in Railway dashboard
2. **Browser Console**: Monitor for JavaScript errors
3. **API Connectivity**: Verify backend is responding at configured URL
4. **DNS**: Confirm CNAME propagation (may take up to 24 hours)

### Rollback Plan:
If deployment fails, the previous working configuration is preserved in git history. You can:
1. Revert the configuration changes
2. Redeploy from a previous commit
3. Use Railway's built-in rollback feature

## 🎉 Deployment Ready!

All configuration files have been created and the application is ready for Railway deployment. The setup addresses the deployment difficulties you mentioned and provides a robust foundation for the production environment.

**Next Steps**: Follow the Railway deployment steps above to get https://avatartutor.hkbu.tech/ live!

---
*Prepared by: GitHub Copilot*  
*For: Bob8259*  
*Date: September 5, 2025*
