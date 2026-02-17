# Deployment Guide

## Quick Deploy to Vercel

### Automatic Deployment

1. **Connect Repository to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables**
   In Vercel dashboard, add these environment variables:
   
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
   NODE_ENV=production
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy the frontend

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /home/runner/work/flashloan/flashloan
vercel

# Deploy to production
vercel --prod
```

## Configuration

### Environment Variables

The `.env` file is auto-configured with sensible defaults. Update these values:

**Required for Production:**
- `NEXT_PUBLIC_BACKEND_URL` - Your backend API URL
- `KEY_ENCRYPTION_KEY` - Secure random string
- `ALLOWED_ORIGINS` - Add your Vercel domain

**Optional (for premium features):**
- `HELIUS_RPC_URL` - Helius API endpoint
- `QUICKNODE_RPC_URL` - QuickNode endpoint
- `TRITON_RPC_URL` - Triton endpoint
- `ALCHEMY_RPC_URL` - Alchemy endpoint

### Vercel Configuration

The `vercel.json` is pre-configured with:
- ✅ Next.js framework detection
- ✅ Security headers
- ✅ API rewrites for backend
- ✅ Production optimizations

### Next.js Configuration

The `frontend/next.config.js` includes:
- ✅ React strict mode
- ✅ SWC minification
- ✅ Security headers
- ✅ Console removal in production
- ✅ Image optimization
- ✅ Package import optimization

## Backend Deployment

The backend needs separate deployment. Options:

### 1. Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd backend
railway login
railway init
railway up
```

### 2. Render
- Go to https://render.com
- New Web Service
- Connect repository
- Set build command: `cd backend && npm install`
- Set start command: `cd backend && npm start`

### 3. DigitalOcean App Platform
- Go to https://www.digitalocean.com/products/app-platform
- Create new app from GitHub
- Select backend directory
- Deploy

### 4. VPS (Manual)
```bash
# On your server
git clone <repo>
cd flashloan
./scripts/deploy.sh
```

## Post-Deployment

### 1. Update Environment Variables

Update `.env` with production values:
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
ALLOWED_ORIGINS=https://your-app.vercel.app
NODE_ENV=production
SOLANA_NETWORK=mainnet-beta
```

### 2. Test Deployment

```bash
# Test frontend
curl https://your-app.vercel.app

# Test backend
curl https://your-backend.railway.app/health
```

### 3. Monitor

- Vercel Dashboard: https://vercel.com/dashboard
- Backend logs: Check your backend platform logs
- Set up monitoring: https://vercel.com/docs/concepts/observability

## Troubleshooting

### Build Errors

**Issue**: "Module not found"
```bash
# Solution: Clear cache and reinstall
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

**Issue**: "Environment variable not found"
```bash
# Solution: Add to Vercel dashboard
# Settings → Environment Variables
```

### Runtime Errors

**Issue**: "Cannot connect to backend"
```bash
# Solution: Update NEXT_PUBLIC_BACKEND_URL
# Make sure backend is deployed and accessible
```

**Issue**: "CORS errors"
```bash
# Solution: Update ALLOWED_ORIGINS in backend .env
# Include your Vercel domain
```

## Security Checklist

Before deploying to production:

- [ ] Update `KEY_ENCRYPTION_KEY` to secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure premium RPC endpoints
- [ ] Update `ALLOWED_ORIGINS` with production domains
- [ ] Enable `REQUIRE_AUTH=true` if needed
- [ ] Review security headers in `next.config.js`
- [ ] Test with small amounts first
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Enable HTTPS (automatic on Vercel)

## Scaling

### Frontend (Vercel)
- Automatic scaling
- Global CDN
- Edge functions available

### Backend
- Use load balancer for multiple instances
- Configure PM2 cluster mode:
  ```bash
  pm2 start backend/index.js -i max
  ```
- Consider Redis for session management

## Cost Estimates

### Free Tier
- **Vercel**: Hobby plan (free)
  - 100GB bandwidth
  - 6,000 build minutes
  - Perfect for testing

- **Railway**: $5/month credit (free)
  - Good for backend
  - Can handle moderate traffic

### Production
- **Vercel Pro**: $20/month
  - Unlimited bandwidth
  - Better performance
  
- **Backend**: $10-50/month
  - Depends on traffic
  - Railway/Render/DigitalOcean

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Issues: https://github.com/SMSDAO/flashloan/issues

---

**Quick Start**: Just push to GitHub, connect to Vercel, add environment variables, and deploy! 🚀
