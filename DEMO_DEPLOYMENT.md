# 🚀 Demo Deployment Guide

This guide explains how to set up and deploy the Einkaufsliste demo on GitHub Pages and other platforms.

## 📋 Table of Contents

- [GitHub Pages Deployment](#github-pages-deployment)
- [Backend Demo Deployment](#backend-demo-deployment)
- [Local Demo Setup](#local-demo-setup)
- [Demo Configuration](#demo-configuration)
- [Troubleshooting](#troubleshooting)

## 🌐 GitHub Pages Deployment

### Automatic Deployment

The repository includes GitHub Actions workflows that automatically deploy to GitHub Pages on every push to the `main` branch.

### Manual Setup

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as source

2. **Configure Deployment**:
   - The workflow `.github/workflows/deploy-pages.yml` handles the deployment
   - Frontend is built and deployed automatically
   - Demo configuration is included

3. **Access Demo**:
   - Visit: `https://ochtii.github.io/einkaufsliste`
   - Demo landing page: `https://ochtii.github.io/einkaufsliste/demo.html`

### Demo Features (Frontend-Only)

- ✅ **Offline Mode**: Works without backend
- ✅ **Demo Data**: Pre-loaded sample lists and articles
- ✅ **Local Storage**: Data persists in browser
- ✅ **Full UI**: All frontend features available
- ❌ **Multi-User**: Single user mode only
- ❌ **Real Sync**: No real-time synchronization

## 🖥️ Backend Demo Deployment

### Platform Options

Choose one of these platforms for backend deployment:

#### Railway.app (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd backend
railway login
railway init
railway up
```

#### Heroku
```bash
# Install Heroku CLI and deploy
cd backend
heroku create einkaufsliste-demo
git subtree push --prefix backend heroku main
```

#### Render.com
```bash
# Connect your GitHub repository to Render
# Set build command: cd backend && npm install
# Set start command: cd backend && npm start
```

### Backend Environment Variables

Set these environment variables on your chosen platform:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-demo-jwt-secret
DB_PATH=./demo.sqlite
DEMO_MODE=true
CORS_ORIGIN=https://ochtii.github.io
```

### Update Frontend Configuration

After deploying the backend, update the frontend configuration:

1. Edit `frontend/public/demo-config.js`
2. Update the `backendUrl` to your deployed backend URL
3. Commit and push to trigger re-deployment

## 💻 Local Demo Setup

### Frontend-Only Demo

```bash
# Start frontend with demo mode
cd frontend
npm start

# Open browser with demo parameter
# http://localhost:3000?demo=true
```

### Full Stack Demo

```bash
# Terminal 1: Start backend
cd backend
npm install
npm start

# Terminal 2: Start frontend
cd frontend
npm install
npm start

# Visit: http://localhost:3000
```

## ⚙️ Demo Configuration

### Demo Config File

The demo configuration is in `frontend/public/demo-config.js`:

```javascript
window.DEMO_CONFIG = {
  isDemoMode: true,
  backendUrl: 'your-backend-url',
  features: {
    registration: true,
    userManagement: false,
    adminPanel: false,
    realTimeSync: false,
    offlineMode: true
  },
  demoCredentials: {
    user: { username: 'demo', password: 'demo123' },
    admin: { username: 'admin', password: 'admin123' }
  }
};
```

### Customization Options

- **Demo Data**: Modify sample lists and articles
- **Feature Flags**: Enable/disable specific features
- **Styling**: Customize demo banner and messages
- **Authentication**: Adjust demo credentials

## 🔧 Troubleshooting

### Common Issues

#### GitHub Pages Not Updating
```bash
# Check GitHub Actions
# Go to repository > Actions tab
# Verify workflow completed successfully
```

#### Backend Deployment Fails
```bash
# Check platform-specific logs
# Verify environment variables
# Ensure database is properly initialized
```

#### Demo Mode Not Working
```bash
# Check browser console for errors
# Verify demo-config.js is loaded
# Clear browser cache and localStorage
```

### Debug Commands

```bash
# Check build output
cd frontend
npm run build
ls -la build/

# Test demo configuration
node -e "console.log(require('./public/demo-config.js'))"

# Verify GitHub Actions
gh workflow list
gh run list
```

## 📊 Demo Analytics

### GitHub Pages Usage

Monitor demo usage through:
- GitHub repository insights
- Google Analytics (if configured)
- GitHub Pages traffic graphs

### Performance Monitoring

- Lighthouse CI in GitHub Actions
- Core Web Vitals tracking
- Error monitoring with Sentry (optional)

## 🚀 Advanced Deployment

### Custom Domain

1. Add `CNAME` file to `frontend/public/`:
```
yourdomain.com
```

2. Configure DNS:
```
CNAME: yourdomain.com -> ochtii.github.io
```

### CDN Integration

For faster global delivery, consider:
- Cloudflare Pages
- Netlify
- Vercel

### SSL Certificate

GitHub Pages provides automatic HTTPS for:
- `*.github.io` domains
- Custom domains (with verification)

## 📝 Demo Documentation

### User Guide

Create comprehensive demo documentation:
- Feature walkthrough
- Step-by-step tutorials
- Video demonstrations
- FAQ section

### Developer Guide

Include technical documentation:
- API endpoints
- Database schema
- Deployment procedures
- Customization options

---

## 🎯 Next Steps

1. **Deploy Backend**: Choose and configure a backend platform
2. **Test Demo**: Verify all features work correctly
3. **Update Documentation**: Add platform-specific instructions
4. **Monitor Usage**: Set up analytics and monitoring
5. **Gather Feedback**: Collect user feedback for improvements

For questions or issues, please check the [main README](../README.md) or open an issue on GitHub.
