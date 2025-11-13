# CWAGO Tracking Monitor - Deployment Guide

## Production Deployment Checklist

### 1. Pre-Deployment Verification

\`\`\`bash
# Test local build
npm run build

# Verify all environment variables
echo "Checking required env vars..."
required_vars=("GOOGLE_SHEETS_PRIVATE_KEY" "GOOGLE_SHEETS_CLIENT_EMAIL" "GOOGLE_SHEET_ID" "CORS_ORIGINS")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var is not set"
    exit 1
  fi
done
echo "All required variables are set"

# Run health check
curl http://localhost:3000/api/health
\`\`\`

### 2. Environment Configuration

#### Development (.env.local)
\`\`\`
NODE_ENV=development
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=dev@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your_dev_sheet_id
NEXT_PUBLIC_API_URL=http://localhost:3000
LOG_LEVEL=debug
\`\`\`

#### Staging (.env.staging)
\`\`\`
NODE_ENV=staging
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=staging@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your_staging_sheet_id
NEXT_PUBLIC_API_URL=https://staging.your-domain.com
CORS_ORIGINS=https://staging.your-domain.com
LOG_LEVEL=info
\`\`\`

#### Production (.env.production)
\`\`\`
NODE_ENV=production
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=prod@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your_prod_sheet_id
NEXT_PUBLIC_API_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
LOG_LEVEL=warn
\`\`\`

### 3. Vercel Deployment Steps

#### Step 1: Connect Repository
\`\`\`bash
# Option A: Using Vercel CLI
npm i -g vercel
vercel login
vercel link

# Option B: Using GitHub
# Push to GitHub, connect via vercel.com dashboard
\`\`\`

#### Step 2: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

1. Add all production variables
2. Set appropriate Environment: Production, Preview, Development
3. Verify sensitive keys are masked

#### Step 3: Deploy
\`\`\`bash
# Deploy to production
vercel --prod

# Monitor deployment
vercel logs --prod
\`\`\`

### 4. Post-Deployment Verification

\`\`\`bash
PROD_URL="https://your-domain.com"

# Health check
curl $PROD_URL/api/health

# Dashboard availability
curl $PROD_URL/ -I

# API responsiveness
time curl $PROD_URL/api/overview

# Cache working
curl $PROD_URL/api/cache/stats
\`\`\`

### 5. Monitoring Setup

#### Vercel Analytics
- Already integrated via `@vercel/analytics`
- View at https://vercel.com/dashboard

#### Error Tracking (Optional)
\`\`\`typescript
// Install Sentry
npm install @sentry/nextjs

// Configure in layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
\`\`\`

#### Uptime Monitoring
- Recommended: UptimeRobot or Checkly
- Monitor: `https://your-domain.com/api/health`
- Alert if status !== 200

### 6. Database Migration (If Adding Supabase)

\`\`\`sql
-- Create tables for caching Google Sheets data
CREATE TABLE sheets_sync_log (
  id UUID PRIMARY KEY,
  synced_at TIMESTAMP DEFAULT NOW(),
  row_count INT,
  status TEXT,
  error_message TEXT
);

CREATE TABLE sheets_data_cache (
  id UUID PRIMARY KEY,
  date_key TEXT UNIQUE,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_date_key ON sheets_data_cache(date_key);
CREATE INDEX idx_updated_at ON sheets_data_cache(updated_at DESC);
\`\`\`

### 7. Rollback Plan

\`\`\`bash
# If deployment fails, revert to previous version
vercel rollback

# Or manually redeploy from git
git revert <commit-hash>
vercel --prod
\`\`\`

### 8. Performance Tuning

#### Recommended Vercel Settings
- Region: Closest to your users
- Runtime: Node.js 18+ (default)
- Memory: 512MB (for API functions)
- Duration: 30 seconds max

#### Expected Performance
- API Response: <500ms (cached), <2s (fresh)
- Dashboard Load: <1s (with caching)
- Lighthouse Score: >85 (target)

### 9. Troubleshooting

#### Issue: 502 Bad Gateway
\`\`\`
Likely: Google Sheets API timeout
Solution: Check internet connection, verify API credentials
\`\`\`

#### Issue: Environment Variables Not Loading
\`\`\`
Solution: Verify in Vercel Dashboard that variables are set
Redeploy: vercel --prod --force
\`\`\`

#### Issue: High API Usage
\`\`\`
Likely: Caching not working
Debug: Check /api/cache/stats
Reset cache: Call /api/cache/clear (implement if needed)
\`\`\`

### 10. Rollback Procedure

If you need to rollback to a previous version:

1. **Option 1: Use Vercel UI**
   - Go to Deployments tab
   - Click three dots on previous deployment
   - Click "Promote to Production"

2. **Option 2: Using CLI**
   \`\`\`bash
   vercel rollback --prod
   \`\`\`

3. **Option 3: Git Rollback**
   \`\`\`bash
   git revert <commit-hash>
   git push origin main
   # Vercel automatically deploys
   \`\`\`

### 11. Scheduled Maintenance

Set up automated caching refresh:

\`\`\`javascript
// pages/api/cron/refresh-cache.js
export const config = {
  api: {
    responseLimit: '8mb',
  },
};

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await import('@/lib/google-sheets').then(m => m.getCompleteDashboardData());
    res.status(200).json({ message: 'Cache refreshed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
\`\`\`

Configure in Vercel using cron jobs:
\`\`\`json
{
  "crons": [{
    "path": "/api/cron/refresh-cache",
    "schedule": "0 */6 * * *"
  }]
}
\`\`\`

### 12. Security Checklist Before Production

- [ ] All secrets are environment variables (not in code)
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] CORS is restricted to your domain
- [ ] API rate limiting is configured
- [ ] Google Sheets service account has minimal permissions
- [ ] Error messages don't leak sensitive information
- [ ] Logging is not exposing secrets
- [ ] SSL certificate is valid
- [ ] Security headers are in place

### 13. Support & Escalation

If you encounter production issues:

1. **Check Vercel Status**: https://www.vercel-status.com/
2. **Review Logs**: `vercel logs --prod --follow`
3. **Contact Support**: Vercel dashboard → Help → Contact Support
4. **Escalation**: For critical issues, contact Vercel Priority Support

---

**Last Updated:** November 14, 2025
