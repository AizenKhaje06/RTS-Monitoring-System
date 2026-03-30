# Quick Start Guide

Get your RTS Monitoring Dashboard up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Google Cloud Project with Sheets API enabled
- Service Account credentials
- Google Spreadsheet with parcel data

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd rts-monitoring-system

# Install dependencies
npm install
# or
pnpm install
```

## Step 2: Google Cloud Setup

### Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name it (e.g., "rts-dashboard")
   - Grant "Editor" role
   - Click "Done"

### Generate Credentials

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose JSON format
5. Download the key file

### Share Spreadsheet

1. Open your Google Spreadsheet
2. Click "Share"
3. Add service account email (from JSON file)
4. Give "Viewer" or "Editor" access

## Step 3: Environment Setup

Create `.env.local` file in project root:

```env
# Copy from your service account JSON file
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Your spreadsheet ID (from URL)
# https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
GOOGLE_SHEET_ID=your-spreadsheet-id-here

# NextAuth (Optional - for future features)
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Finding Your Spreadsheet ID

From this URL:
```
https://docs.google.com/spreadsheets/d/1TR7JrBvk2aRxSj-AX6tWfDLErZSRaBtnIjvSR-GyLNo/edit
```

The ID is: `1TR7JrBvk2aRxSj-AX6tWfDLErZSRaBtnIjvSR-GyLNo`

## Step 4: Prepare Your Data

### Required Sheet Format

Your Google Sheets should have these columns (order doesn't matter):

**Required:**
- Date
- Status
- Shipper/Store

**Optional (but recommended):**
- Consignee Region (province name)
- Municipality
- Barangay
- COD Amount
- Service Charge
- Total Cost

### Sheet Naming

- Include "2025" in sheet name (e.g., "JANUARY 2025", "FEB 2025")
- Sheets without "2025" will be skipped
- Sheets starting with "Sheet" are ignored

### Example Data

```
Date       | Status    | Shipper    | Consignee Region | COD Amount | Service Charge | Total Cost
-----------|-----------|------------|------------------|------------|----------------|------------
2025-01-15 | DELIVERED | Store A    | Manila           | 1500       | 50             | 100
2025-01-16 | RETURNED  | Store B    | Cebu             | 2000       | 60             | 120
```

## Step 5: Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Load Your Data

1. Click "Enter Dashboard" button
2. Wait for data processing (first time may take 30-60 seconds)
3. Explore your dashboard!

## Common Issues & Solutions

### Issue: "Failed to process data"

**Solution:**
- Check service account email in `.env.local`
- Verify spreadsheet is shared with service account
- Ensure GOOGLE_SHEET_ID is correct
- Check private key format (must include `\n` for line breaks)

### Issue: "No data available"

**Solution:**
- Verify sheet names include "2025"
- Check that sheets have data rows (not just headers)
- Ensure columns match expected format
- Review browser console for errors

### Issue: "Unknown provinces"

**Solution:**
- Check province name spelling
- Ensure "Consignee Region" column exists
- Province names should match Philippine provinces
- Check Data Quality tab for details

### Issue: Slow loading

**Solution:**
- First load is always slower (no cache)
- Subsequent loads use 30-minute cache
- Reduce data size by filtering
- Check internet connection

## Quick Tips

### 🚀 Performance
- Data is cached for 30 minutes
- Use filters to focus on specific data
- Export large datasets in chunks

### 📊 Best Practices
- Update spreadsheet daily
- Use consistent date formats
- Include all optional columns for full features
- Review Data Quality tab regularly

### 🔍 Navigation
- Use sidebar to switch between reports
- Use tabs within dashboard for different views
- Export button available on all reports
- Filters persist across views

### 💡 Features to Try
1. **Trends Tab** - See performance over time
2. **Comparison Tab** - Compare two months
3. **Insights Tab** - Get AI recommendations
4. **Data Quality Tab** - Check data completeness
5. **Export Menu** - Download reports

## Next Steps

### Explore Reports

1. **Parcel Dashboard** - Overview and trends
2. **Performance Report** - Regional analysis
3. **Store Report** - Shipper performance
4. **Financial Report** - Profit & loss

### Customize

- Adjust cache duration in `lib/cache.ts`
- Modify validation rules in `lib/validation.ts`
- Customize insights in `lib/analytics.ts`
- Update theme in `app/globals.css`

### Advanced Features

- Set up automated reports
- Integrate with other systems
- Add custom analytics
- Build custom dashboards

## Getting Help

### Documentation
- [README.md](README.md) - Full documentation
- [FEATURES.md](FEATURES.md) - Feature details
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [TODO.md](TODO.md) - Planned features

### Support
- Check browser console for errors
- Review Data Quality dashboard
- Clear cache and refresh
- Contact support team

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] Service account credentials correct
- [ ] Spreadsheet shared with service account
- [ ] Sheet names include "2025"
- [ ] Data has required columns
- [ ] Browser console shows no errors

## Success Indicators

You're ready when you see:

✅ Dashboard loads without errors
✅ Status cards show data
✅ Regional breakdown displays
✅ Charts render correctly
✅ Export menu works
✅ Filters apply successfully

## What's Next?

Now that you're up and running:

1. Explore all four reports
2. Try different filters
3. Export some data
4. Review insights
5. Check data quality
6. Compare time periods
7. Share with your team!

---

**Need more help?** Check the full [README.md](README.md) or contact support.

**Found a bug?** Create an issue on GitHub.

**Have a feature request?** Check [TODO.md](TODO.md) or suggest new features!
