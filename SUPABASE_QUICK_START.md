# Supabase Migration - Quick Start

## 🚀 3-Step Process

### Step 1: Download SQL File
1. Open your dashboard at http://localhost:3001
2. Click **"Insights"** tab
3. Click **"Preview Stats"** to see what will be exported
4. Click **"Download SQL File"**
5. File saved: `rts-supabase-migration-[timestamp].sql`

### Step 2: Open Supabase
1. Go to https://supabase.com
2. Open your project (or create new one)
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

### Step 3: Import Data
1. Open the downloaded SQL file in a text editor
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor (Ctrl+V)
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait 5-10 seconds
6. Done! ✅

## ✅ Verify Import

Go to **Table Editor** → **parcels** table

You should see:
- **981 rows** (all your parcels)
- Columns: parcel_date (DATE), date_text, month, shipper_name, address, status, province, region, island, etc.

## 📊 Quick Queries

```sql
-- Total parcels
SELECT COUNT(*) FROM parcels;

-- By status
SELECT normalized_status, COUNT(*) 
FROM parcels 
GROUP BY normalized_status;

-- By date (using standard DATE column)
SELECT parcel_date, COUNT(*) 
FROM parcels 
WHERE parcel_date IS NOT NULL
GROUP BY parcel_date 
ORDER BY parcel_date DESC;

-- Parcels in March 2026
SELECT * FROM parcels 
WHERE parcel_date >= '2026-03-01' 
  AND parcel_date < '2026-04-01'
LIMIT 10;

-- By region
SELECT island, region, COUNT(*) 
FROM parcels 
GROUP BY island, region 
ORDER BY COUNT(*) DESC;

-- By month
SELECT month, COUNT(*) 
FROM parcels 
GROUP BY month 
ORDER BY month;

-- Delivered parcels with dates
SELECT parcel_date, shipper_name, province, cod_amount
FROM parcels 
WHERE normalized_status = 'DELIVERED' 
  AND parcel_date IS NOT NULL
ORDER BY parcel_date DESC
LIMIT 10;
```

## 🎯 What You Get

### Database Table: `parcels`
- ✅ 981 records from all Google Sheets tabs
- ✅ Indexed for fast queries
- ✅ Row Level Security enabled
- ✅ Auto-updating timestamps
- ✅ Complete parcel data with location info

### File Size
- **~490 KB** SQL file
- **Fast download** (< 1 second)
- **Fast import** (5-10 seconds)

## 🔥 Next Steps

### Option 1: Keep Using Google Sheets
- Continue data entry in Google Sheets
- Export to Supabase periodically for analytics
- Best of both worlds!

### Option 2: Switch to Supabase
- Use Supabase for all new entries
- Build forms that write directly to database
- Real-time updates across all users

### Option 3: Hybrid Approach
- Google Sheets for data entry (familiar interface)
- Automatic sync to Supabase (via API)
- Dashboard reads from Supabase (faster!)

## 🛠️ Troubleshooting

### "Table already exists"
```sql
-- Drop existing table first
DROP TABLE IF EXISTS parcels CASCADE;
-- Then run the full SQL file again
```

### "Permission denied"
- Check your Supabase project settings
- Ensure you're logged in
- Try running in SQL Editor (not API)

### "Syntax error"
- Make sure you copied the ENTIRE SQL file
- Don't modify the SQL content
- Check for any copy-paste issues

## 📞 Support

If you need help:
1. Check the full guide: `SUPABASE_MIGRATION_GUIDE.md`
2. Review Supabase logs (Dashboard → Logs)
3. Check browser console for errors

## 🎉 Success!

Once imported, you can:
- Query data with SQL
- Build real-time dashboards
- Create APIs automatically
- Scale to millions of records
- Never worry about Google Sheets limits again!

**Total time: 5 minutes from start to finish!** ⚡
