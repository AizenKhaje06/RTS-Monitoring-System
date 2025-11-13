# CWAGO Tracking Monitor - Quick Start Deployment Guide

## 5-Minute Security Review

Run this to verify everything is secure:

\`\`\`bash
# Check environment template exists
ls -la .env.example

# Verify error handler
grep -l "error-handler" lib/*.js

# Check security headers in config
grep "X-Frame-Options" next.config.mjs

# Test health endpoint
curl http://localhost:3000/api/health
\`\`\`

## 30-Minute Production Setup

### Step 1: Environment Setup (5 min)
\`\`\`bash
# Copy template
cp .env.example .env.local

# Add your Google Sheets credentials
nano .env.local
# Fill in:
# - GOOGLE_SHEETS_PRIVATE_KEY
# - GOOGLE_SHEETS_CLIENT_EMAIL
# - GOOGLE_SHEET_ID
# - CORS_ORIGINS (your production domain)
\`\`\`

### Step 2: Local Testing (10 min)
\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test endpoints in another terminal
curl http://localhost:3000/api/health
curl http://localhost:3000/api/dashboard
\`\`\`

### Step 3: Deploy to Vercel (10 min)
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables
vercel env add GOOGLE_SHEETS_PRIVATE_KEY
vercel env add GOOGLE_SHEETS_CLIENT_EMAIL
vercel env add GOOGLE_SHEET_ID
vercel env add CORS_ORIGINS

# Deploy
vercel --prod

# Verify deployment
curl https://your-app.vercel.app/api/health
\`\`\`

## Issue Checklist

### If dashboard shows no data:
1. Verify `.env` has correct GOOGLE_SHEET_ID
2. Check service account has sheet access (Share → Add email)
3. Run: `curl http://localhost:3000/api/sheets/raw`
4. Check browser console for errors

### If you get 502 errors:
1. Check Google Sheets credentials are correct
2. Increase timeout: Add to `vercel.json`
   \`\`\`json
   "functions": {
     "app/api/[[...path]]/route.js": { "maxDuration": 60 }
   }
   \`\`\`
3. Check Vercel logs: `vercel logs --prod`

### If API is slow:
1. Caching may not be working
2. Check: `curl https://your-app.vercel.app/api/cache/stats`
3. Look for high `totalEntries` and low `expiredEntries`

## Performance Targets

After deployment, you should see:
- ✅ Dashboard loads in <2 seconds (with cache)
- ✅ API health check responds in <100ms
- ✅ Cache hit rate >80%
- ✅ No 5xx errors
- ✅ <1% API quota per day

## Monitoring Your System

### Daily Checks
\`\`\`bash
# Health check
curl https://your-app.vercel.app/api/health

# Check cache stats
curl https://your-app.vercel.app/api/cache/stats

# View recent logs
vercel logs --prod --tail
\`\`\`

### Weekly Health Report
\`\`\`bash
# Generate report
cat > health-report.sh << 'EOF'
#!/bin/bash
DOMAIN="https://your-app.vercel.app"

echo "=== System Health Report ==="
echo "Time: $(date)"
echo ""
echo "Health Check:"
curl -s $DOMAIN/api/health | jq .
echo ""
echo "Cache Statistics:"
curl -s $DOMAIN/api/cache/stats | jq .cache
echo ""
echo "Response Time:"
time curl -s $DOMAIN/api/dashboard > /dev/null
EOF

chmod +x health-report.sh
./health-report.sh
\`\`\`

## Common Tasks

### Clear Cache (if data seems stale)
\`\`\`javascript
// Create temporary endpoint in app/api/cache/clear/route.js
export async function POST(request) {
  // Add auth check first!
  const { invalidateAllCache } = await import('@/lib/cache-middleware.js');
  invalidateAllCache();
  return Response.json({ success: true });
}

// Call it:
curl -X POST https://your-app.vercel.app/api/cache/clear
\`\`\`

### Update Sheet Data Format
1. Update column mapping in `lib/google-sheets.js`
2. Clear cache (see above)
3. Test with: `curl https://your-app.vercel.app/api/sheets/raw`

### Add New API Endpoint
1. Add route in `app/api/[[...path]]/route.js`
2. Add logic to `lib/google-sheets.js`
3. Add caching config in `lib/cache-middleware.js`
4. Test locally first

## Security Checklist

Before going to production, verify:
- [ ] `.env` file is not in git (check .gitignore)
- [ ] CORS_ORIGINS is set to your domain only
- [ ] All environment variables are set in Vercel
- [ ] Google Sheets are shared with service account only
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS is enforced (automatic on Vercel)

## Getting Help

1. **Check Logs:** `vercel logs --prod --follow`
2. **Read Docs:** See AUDIT_REPORT.md and DEPLOYMENT_GUIDE.md
3. **Test Endpoint:** Use curl to test specific endpoints
4. **Review Code:** Check inline comments in updated files
5. **Vercel Status:** Check https://www.vercel-status.com/

## Key Files

| File | Purpose | Last Updated |
|------|---------|--------------|
| `.env.example` | Environment template | Nov 14 |
| `lib/logger.js` | Structured logging | Nov 14 |
| `lib/error-handler.js` | Error handling | Nov 14 |
| `lib/cache-middleware.js` | Caching | Nov 14 |
| `next.config.mjs` | Security headers | Nov 14 |
| `AUDIT_REPORT.md` | Detailed audit | Nov 14 |
| `DEPLOYMENT_GUIDE.md` | Deployment steps | Nov 14 |

---

**Need more help?** See the full documentation files included in this delivery.

**Status:** ✅ Ready to deploy
**Last Updated:** November 14, 2025
