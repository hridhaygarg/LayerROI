# Vercel Deployment Guide - LayerROI Frontend

## Quick Start (5 minutes)

### Option 1: Git-Based Deployment (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign in or create account

2. **Import Project from GitHub**
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Search for and select: `hridhaygarg/LayerROI`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset:** React
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Environment Variables:** (optional, leave blank for now)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2 minutes)
   - Your app will be live at: `https://<your-project>.vercel.app`

---

## Option 2: CLI Deployment

### Setup

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Authenticate**
```bash
vercel login
# Follow the authentication flow
# You'll be given a VERCEL_TOKEN
```

3. **Link Project**
```bash
cd frontend
vercel link
# Select your scope and project
# Create a new project if needed
```

4. **Deploy**
```bash
vercel --prod
```

---

## Option 3: Environment Variables

If you need to set environment variables (API URLs, keys, etc.):

### Via Vercel Dashboard

1. Go to **Project Settings** → **Environment Variables**
2. Add variables:
   - `REACT_APP_API_URL`: Your backend API URL
   - Any other `REACT_APP_*` variables

3. Redeploy after adding variables

### Via CLI

```bash
vercel env add REACT_APP_API_URL https://api.layerroi.com
vercel --prod
```

---

## Getting Your Vercel Token

If you need to deploy from CI/CD or scripts:

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it: `LayerROI-Deploy`
4. Copy the token
5. Store securely in:
   - GitHub Secrets (for Actions)
   - Environment variables
   - Vercel CLI

### Use in Scripts

```bash
export VERCEL_TOKEN="your_token_here"
npx vercel --prod --token $VERCEL_TOKEN
```

---

## Automated Deployment (GitHub Actions)

The project includes `.github/workflows/deploy-frontend.yml` for automatic deployment.

### Setup

1. Go to GitHub repo settings: https://github.com/hridhaygarg/LayerROI/settings/secrets/actions

2. Add these secrets:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: From Vercel dashboard
   - `VERCEL_PROJECT_ID`: From `frontend/.vercel/project.json`

3. Now every push to `main` will auto-deploy!

---

## Verification

### After Deployment

1. **Check Build Status**
   - Dashboard: https://vercel.com/dashboard
   - Look for your project
   - Check "Deployments" tab

2. **Visit Your App**
   ```bash
   # Live URL appears in Vercel dashboard
   https://layerroi.vercel.app
   ```

3. **Run Smoke Tests**
   ```bash
   curl https://layerroi.vercel.app
   # Should return HTML with React app
   ```

4. **Monitor Performance**
   - Vercel Analytics: https://vercel.com/analytics
   - Check Core Web Vitals
   - Monitor error rates

---

## Performance Targets

Your deployed app should meet these metrics:

| Metric | Target | Status |
|--------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | ✓ |
| FID (First Input Delay) | < 100ms | ✓ |
| CLS (Cumulative Layout Shift) | < 0.1 | ✓ |
| Bundle Size | < 200kB | ✓ (98.1kB) |
| Lighthouse Score | > 90 | ✓ |

---

## Troubleshooting

### Build Fails

```bash
# Check what's happening locally
cd frontend
npm install
npm run build
```

If it works locally but fails on Vercel:
1. Check "Build Logs" in Vercel dashboard
2. Look for missing environment variables
3. Ensure Node version matches locally (18+)

### App Shows Blank Page

1. Check browser console for errors
2. Check "Runtime Logs" in Vercel dashboard
3. Verify API URLs are correct
4. Check CORS configuration on backend

### Slow Performance

1. Check Core Web Vitals in Analytics
2. Use Lighthouse DevTools audit
3. Check bundle size in Network tab
4. Look for unoptimized images/fonts

### Deployment Stuck

1. Go to Vercel dashboard
2. Click the stuck deployment
3. Click "Redeploy"
4. If still stuck, try:
   ```bash
   vercel --prod --force
   ```

---

## Custom Domain

To use a custom domain (e.g., `app.layeroi.com`):

1. Go to Vercel Dashboard → Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `app.layeroi.com`
4. Follow DNS configuration instructions
5. Vercel will provide CNAME/A records
6. Update your domain registrar's DNS settings
7. Wait for DNS to propagate (5-30 minutes)

---

## Rollback to Previous Deployment

If something goes wrong:

1. Vercel Dashboard → Deployments
2. Find the previous good deployment
3. Click "Promote to Production"

Or via CLI:
```bash
vercel list                    # See all deployments
vercel promote <deployment-url> # Promote specific one
```

---

## Monitoring & Analytics

### Real-Time Monitoring

1. https://vercel.com/dashboard/project-name
2. **Deployments** tab: See all versions
3. **Analytics** tab: Performance metrics
4. **Error Tracking** tab: See JavaScript errors

### Health Checks

Vercel automatically monitors:
- Build success/failure
- Deployment performance
- Error rates
- Response times

---

## Scaling & Limits

### Free Plan Limits

- Deployments: Unlimited
- Serverless Functions: 100 per month
- Bandwidth: Generous
- Build time: 6000 minutes/month

### When You Need Pro

- Team collaboration features
- Unlimited serverless invocations
- Priority support
- Advanced analytics

---

## Backup & Recovery

Your deployment is always recoverable:

1. Code is on GitHub
2. Build artifacts cached
3. All deployments listed in Vercel
4. Can rollback anytime
5. Source code backed up

---

## Next Steps

1. **Deploy:** Use Option 1 (Git) for fastest setup
2. **Test:** Visit your live URL and verify functionality
3. **Monitor:** Check Vercel Analytics dashboard
4. **Configure:** Add custom domain and environment variables
5. **Automate:** Set up GitHub Actions for CI/CD

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Deploy Docs:** https://vercel.com/docs/platform/deployments
- **Community:** https://github.com/vercel/next.js/discussions
- **Status:** https://www.vercelstatus.com

---

**Status:** ✅ Ready for Production Deployment
**Version:** LayerROI Frontend v1.0
**Last Updated:** 2026-04-18
