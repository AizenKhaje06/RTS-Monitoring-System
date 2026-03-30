# Deployment Guide

Complete guide for deploying the RTS Monitoring Dashboard to production.

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in development
- [ ] All features tested (see TESTING_GUIDE.md)
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Environment
- [ ] Production environment variables ready
- [ ] Google Sheets service account configured
- [ ] Spreadsheet shared with service account
- [ ] API credentials secured
- [ ] Secrets properly stored

### Performance
- [ ] Build completes successfully
- [ ] No build warnings
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Caching configured

### Security
- [ ] Environment variables not in code
- [ ] No sensitive data exposed
- [ ] API endpoints secured
- [ ] CORS configured properly
- [ ] Rate limiting considered

## 📦 Build Process

### 1. Local Build Test

```bash
# Clean install
rm -rf node_modules .next
npm install

# Run build
npm run build

# Test production build locally
npm start
```

**Verify:**
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Application runs correctly
- [ ] All features work

### 2. Environment Variables

Create production `.env.production`:

```env
# Google Sheets (Production)
GOOGLE_SHEETS_PRIVATE_KEY="[PRODUCTION_KEY]"
GOOGLE_SHEETS_CLIENT_EMAIL=[PRODUCTION_EMAIL]
GOOGLE_SHEET_ID=[PRODUCTION_SHEET_ID]

# NextAuth (Production)
NEXTAUTH_SECRET=[STRONG_RANDOM_SECRET]
NEXTAUTH_URL=https://your-domain.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=[YOUR_GA_ID]
```

**Security Notes:**
- Use different service account for production
- Generate strong NEXTAUTH_SECRET
- Never commit .env files
- Use platform secrets management

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

#### Setup
1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Configure environment variables
4. Deploy

#### Steps:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Environment Variables in Vercel:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add all variables from `.env.production`
4. Redeploy

#### Vercel Configuration:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

### Option 2: Netlify

#### netlify.toml:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### Deploy:
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Option 3: Docker

#### Dockerfile:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run:
```bash
# Build image
docker build -t rts-dashboard .

# Run container
docker run -p 3000:3000 \
  -e GOOGLE_SHEETS_PRIVATE_KEY="..." \
  -e GOOGLE_SHEETS_CLIENT_EMAIL="..." \
  -e GOOGLE_SHEET_ID="..." \
  rts-dashboard
```

### Option 4: AWS (EC2/ECS)

#### EC2 Setup:
```bash
# SSH into EC2 instance
ssh -i key.pem ubuntu@your-instance

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo
cd rts-monitoring-system

# Install dependencies
npm install

# Build
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "rts-dashboard" -- start
pm2 save
pm2 startup
```

#### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

## 🔒 Security Hardening

### 1. Environment Variables
```bash
# Generate strong secret
openssl rand -base64 32

# Use in NEXTAUTH_SECRET
```

### 2. HTTPS Setup
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### 3. Security Headers

Add to `next.config.mjs`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### 2. Analytics (Google Analytics)

```javascript
// lib/gtag.js
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export const pageview = (url) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}
```

### 3. Performance Monitoring

```javascript
// lib/monitoring.js
export function reportWebVitals(metric) {
  console.log(metric)
  // Send to analytics
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 Post-Deployment

### 1. Smoke Tests

```bash
# Test homepage
curl https://your-domain.com

# Test API
curl https://your-domain.com/api/google-sheets/spreadsheets

# Test health
curl https://your-domain.com/api/health
```

### 2. Performance Check

- [ ] Page load < 3 seconds
- [ ] API response < 1 second (cached)
- [ ] No console errors
- [ ] All features work
- [ ] Mobile responsive

### 3. Monitoring

- [ ] Error tracking active
- [ ] Analytics configured
- [ ] Uptime monitoring setup
- [ ] Alerts configured
- [ ] Logs accessible

## 🔧 Maintenance

### Regular Tasks

**Daily:**
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Review analytics

**Weekly:**
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Check disk space
- [ ] Backup data

**Monthly:**
- [ ] Security audit
- [ ] Performance review
- [ ] Cost analysis
- [ ] Feature planning

### Backup Strategy

```bash
# Backup environment variables
cp .env.production .env.backup

# Backup database (if applicable)
# pg_dump database > backup.sql

# Backup configuration
tar -czf config-backup.tar.gz .env.production next.config.mjs
```

## 🚨 Rollback Plan

### Quick Rollback

**Vercel:**
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

**Docker:**
```bash
# Stop current
docker stop rts-dashboard

# Start previous version
docker run -d --name rts-dashboard rts-dashboard:previous
```

**PM2:**
```bash
# Revert code
git reset --hard HEAD~1

# Rebuild
npm run build

# Restart
pm2 restart rts-dashboard
```

## 📞 Support Contacts

### Emergency Contacts
- DevOps: [email/phone]
- Backend: [email/phone]
- Frontend: [email/phone]
- Manager: [email/phone]

### External Services
- Vercel Support: support@vercel.com
- Google Cloud: [support link]
- Domain Registrar: [support link]

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Build successful
- [ ] Environment variables set
- [ ] Documentation updated

### Deployment
- [ ] Deployed to staging
- [ ] Staging tests passed
- [ ] Deployed to production
- [ ] Production tests passed
- [ ] DNS configured

### Post-Deployment
- [ ] Smoke tests completed
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated
- [ ] Changelog updated

## 🎉 Success Criteria

Deployment is successful when:

- ✅ Application accessible at production URL
- ✅ All features working correctly
- ✅ No critical errors in logs
- ✅ Performance meets targets
- ✅ Security headers present
- ✅ Monitoring active
- ✅ Team can access
- ✅ Backup plan tested

## 📝 Deployment Log Template

```markdown
# Deployment Log - [Date]

## Deployment Details
- Version: [version]
- Environment: [production/staging]
- Deployed by: [name]
- Time: [timestamp]

## Changes
- [List of changes]

## Tests Performed
- [List of tests]

## Issues Encountered
- [Any issues and resolutions]

## Rollback Plan
- [Rollback procedure if needed]

## Sign-Off
- Developer: [name]
- QA: [name]
- Manager: [name]
```

---

**Remember:** Always test in staging before production deployment!
