# Verify SQL File Has Data

## The Problem

Server logs show data is being captured:
- ✅ Contact numbers: "9507337810", "9649244880"
- ✅ Items: "3 LIPO COLLA + FEM WASH", "2 LIPO COLLA + FEM WASH"
- ✅ Tracking: "P5302GZMZDWCM", "P1218H07DP8AM"

But Supabase shows empty fields.

## Most Likely Cause

You're looking at OLD data in Supabase from a previous import.

## Solution

### Step 1: Drop Old Table
```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS parcels CASCADE;
```

### Step 2: Download FRESH SQL File
1. Go to your dashboard
2. Click "Insights" tab
3. Click "Export to Supabase"
4. Download the NEW SQL file (check the timestamp in filename)

### Step 3: Verify SQL File Has Data

Open the downloaded SQL file in a text editor and search for:
- "LIPO COLLA" - should find items
- "P5302GZMZDWCM" - should find tracking numbers
- "9507337810" - should find contact numbers

If you find these in the SQL file, the system is working correctly.

### Step 4: Run the NEW SQL File

1. Open Supabase SQL Editor
2. Paste the ENTIRE new SQL file
3. Click "Run"
4. Wait for completion

### Step 5: Verify in Supabase

```sql
-- Check if items are populated
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN items IS NOT NULL AND items != '' THEN 1 END) as with_items,
  COUNT(CASE WHEN tracking_number IS NOT NULL AND tracking_number != '' THEN 1 END) as with_tracking
FROM parcels;

-- View sample data
SELECT 
  shipper_name,
  items,
  tracking_number,
  contact_number
FROM parcels
WHERE items IS NOT NULL AND items != ''
LIMIT 10;
```

## About Customer Names (April Only Issue)

You mentioned "CUSTOMER NAME: MONTH OF APRIL LANG YUNG MERON, YUNG OTHER MONTH WALA NG CUSTOMER NAME"

This could mean:
1. Your Google Sheets for March and February actually have empty NAME columns
2. OR you're looking at old data in Supabase

Check your Google Sheets:
- Open MARCH 2026 tab → Column B (NAME) - may laman ba?
- Open FEBRUARY 2026 tab → Column B (NAME) - may laman ba?

If walang laman sa Google Sheets, then the system is working correctly - it can only migrate data that exists.

## Quick Test

Run this in Supabase after importing the NEW SQL file:

```sql
-- Count records per month with shipper names
SELECT 
  TO_CHAR(parcel_date, 'YYYY-MM') as month,
  COUNT(*) as total_records,
  COUNT(CASE WHEN shipper_name IS NOT NULL AND shipper_name != '' THEN 1 END) as with_names,
  COUNT(CASE WHEN items IS NOT NULL AND items != '' THEN 1 END) as with_items,
  COUNT(CASE WHEN tracking_number IS NOT NULL AND tracking_number != '' THEN 1 END) as with_tracking
FROM parcels
GROUP BY TO_CHAR(parcel_date, 'YYYY-MM')
ORDER BY month;
```

This will show you exactly how many records have data per month.
