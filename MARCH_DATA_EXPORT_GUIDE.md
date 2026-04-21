# March Data Export Guide

## Overview
Export only March data from Google Sheets to Supabase SQL format.

---

## 🎯 How to Use

### Step 1: Access the Export Button
1. Go to your RTS Monitoring System
2. Click on **Parcel** tab
3. Click on **Insights** sub-tab
4. Scroll down to find **"Export March Data Only"** section

### Step 2: Preview March Data (Optional)
1. Click **"Preview March Stats"** button
2. View statistics:
   - Total March records
   - File size estimate
   - Number of islands covered
   - Number of statuses

### Step 3: Download March SQL File
1. Click **"Download March SQL"** button
2. Wait for the file to download
3. File will be named: `rts-march-only-[timestamp].sql`

### Step 4: Import to Supabase
1. Open your Supabase project
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Open the downloaded SQL file in a text editor
5. Copy ALL contents
6. Paste into Supabase SQL Editor
7. Click **"Run"** or press `Ctrl+Enter`
8. Wait for completion message

### Step 5: Verify Import
1. Go to **Table Editor** in Supabase
2. Find **"parcels"** table
3. Check if March data is imported
4. Verify record count matches the preview

---

## 📊 What Data is Included?

### Date Range:
- **March 2024** (if exists)
- **March 2025** (if exists)
- **March 2026** (if exists)

### All Fields Included:
- Date, Shipper, Address, Contact Number
- Items, Tracking Number
- Status, Reason
- Province, Municipality, Barangay
- Region, Island
- COD Amount, Service Charge, Total Cost
- RTS Fee

### All Statuses Included:
- DELIVERED
- ONDELIVERY
- PENDING
- INTRANSIT
- CANCELLED
- DETAINED
- PROBLEMATIC
- RETURNED
- PENDING FULFILLED
- SHOPEE
- OTHER

---

## 🔍 Technical Details

### API Endpoint:
- **GET** `/api/export-march-only` - Preview stats
- **POST** `/api/export-march-only` - Download SQL file

### Date Filtering Logic:
```typescript
// Filters parcels where:
// - Month = March (month index 2)
// - Year = 2024, 2025, or 2026
const month = parcelDate.getMonth()
const year = parcelDate.getFullYear()
return month === 2 && (year === 2024 || year === 2025 || year === 2026)
```

### SQL File Structure:
1. **DROP TABLE IF EXISTS** - Removes existing table
2. **CREATE TABLE** - Creates parcels table schema
3. **INSERT STATEMENTS** - Batch inserts (100 records per batch)

---

## ⚠️ Important Notes

### Before Running SQL:
- ⚠️ The SQL file includes `DROP TABLE IF EXISTS parcels`
- This will DELETE existing parcels table if it exists
- Make sure to backup existing data first!

### If You Want to Keep Existing Data:
1. Open the SQL file in a text editor
2. Remove the first line: `DROP TABLE IF EXISTS parcels CASCADE;`
3. Remove the CREATE TABLE statement
4. Keep only the INSERT statements
5. Run in Supabase

### Date Format Handling:
- Supports Excel serial dates (e.g., 44927)
- Supports standard date formats (e.g., "2024-03-15")
- Supports datetime formats (e.g., "2024-03-15 10:30:00")

---

## 🐛 Troubleshooting

### "No March data found"
- Check if your Google Sheets has March data
- Verify date column is properly formatted
- Check if dates are in March 2024, 2025, or 2026

### "Export failed"
- Check internet connection
- Verify Google Sheets API is accessible
- Check browser console for errors
- Try refreshing the page

### SQL Import Errors in Supabase
- Make sure you copied the ENTIRE SQL file
- Check for any special characters that might have been corrupted
- Verify Supabase project has enough storage
- Check Supabase logs for specific error messages

### Duplicate Key Errors
- If table already exists with data
- Remove DROP TABLE and CREATE TABLE statements
- Or use a different table name

---

## 📈 Expected Results

### Sample Stats (Example):
```
March Records: 1,234
File Size: 2.5 MB
Islands: 3 (Luzon, Visayas, Mindanao)
Statuses: 10
```

### After Import:
- New table: `parcels`
- Records: All March data from Google Sheets
- Ready for queries and analysis

---

## 🎯 Use Cases

### Why Export March Only?
1. **Testing** - Test with smaller dataset
2. **Monthly Reports** - Generate March-specific reports
3. **Data Analysis** - Analyze March performance
4. **Backup** - Backup specific month data
5. **Migration** - Migrate data month by month

### Next Steps After Import:
1. Run queries to analyze March data
2. Create views for March reports
3. Set up RLS policies if needed
4. Connect to your application
5. Create dashboards and visualizations

---

## 📝 Files Created

1. **app/api/export-march-only/route.ts**
   - API endpoint for March data export
   - Filters and generates SQL

2. **components/march-export-button.tsx**
   - UI component for export button
   - Preview and download functionality

3. **components/dashboard-content.tsx** (modified)
   - Added MarchExportButton to Insights tab

---

## ✅ Success Indicators

You'll know it worked when:
- ✅ SQL file downloads successfully
- ✅ File size matches preview estimate
- ✅ Supabase import completes without errors
- ✅ Record count in Supabase matches preview
- ✅ Can query March data in Supabase

---

## 🚀 Quick Start

**Fastest way to get March data:**
1. Go to Parcel → Insights
2. Click "Download March SQL"
3. Open Supabase SQL Editor
4. Paste and Run
5. Done! ✨

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify Google Sheets access
4. Review this guide's troubleshooting section
5. Check date formats in your Google Sheets

---

## 🎉 Conclusion

You now have a dedicated tool to export only March data from Google Sheets to Supabase. This makes it easy to work with specific monthly data without importing everything!

Happy exporting! 🚀
