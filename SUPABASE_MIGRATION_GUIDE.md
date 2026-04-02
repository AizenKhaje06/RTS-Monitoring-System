# Supabase Migration Guide

## Overview

This system allows you to export ALL your Google Sheets data to Supabase database with a single click.

## What Gets Exported

### All Parcel Data:
- ✅ Date, Month, Shipper Name
- ✅ Full Address, Contact Number
- ✅ Amount, Items, Tracking Number
- ✅ Status (raw and normalized)
- ✅ Reason (for returns)
- ✅ Province, Municipality, Region, Island
- ✅ Financial data (COD, service charge, total cost, RTS fee)

### Total Records: 
- All parcels from ALL sheets (MARCH 2026, FEBRUARY 2026, APRIL 2026, etc.)
- Currently: **981 parcels** (based on your latest data)

## Database Schema

```sql
CREATE TABLE parcels (
  id BIGSERIAL PRIMARY KEY,
  
  -- Basic Info
  parcel_date DATE,              -- ✨ NEW: Standard date format (YYYY-MM-DD)
  date_text TEXT,                -- Original date text from Google Sheets
  month TEXT NOT NULL,
  shipper_name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT,
  
  -- Order Details
  amount DECIMAL(10, 2),
  items TEXT,
  tracking_number TEXT,
  
  -- Status
  status TEXT NOT NULL,
  normalized_status TEXT NOT NULL,
  reason TEXT,
  
  -- Location
  province TEXT NOT NULL,
  municipality TEXT,
  region TEXT NOT NULL,
  island TEXT NOT NULL,
  
  -- Financial
  cod_amount DECIMAL(10, 2),
  service_charge DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  rts_fee DECIMAL(10, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Features

### 1. Automatic Indexes
- Fast queries by status, province, region, island, month
- Optimized for analytics and reporting

### 2. Row Level Security (RLS)
- Enabled by default
- Customize policies based on your auth requirements

### 3. Auto-Update Timestamp
- `updated_at` automatically updates on record changes

### 4. Batch Inserts
- Data inserted in batches of 100 records
- Efficient for large datasets

## How to Use

### Step 1: Add Export Button to Dashboard

Add the SupabaseExportButton component to your dashboard:

```tsx
import { SupabaseExportButton } from "@/components/supabase-export-button"

// In your dashboard component:
<SupabaseExportButton />
```

### Step 2: Click "Download SQL File"

1. Click the button in your dashboard
2. SQL file will download automatically
3. File name: `rts-supabase-migration-[timestamp].sql`

### Step 3: Import to Supabase

1. Open your Supabase project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the ENTIRE SQL file content
5. Click **Run** (or press Ctrl+Enter)
6. Wait for completion (should take 5-10 seconds for 1000 records)

### Step 4: Verify Data

```sql
-- Check total records
SELECT COUNT(*) FROM parcels;

-- Check status distribution
SELECT normalized_status, COUNT(*) 
FROM parcels 
GROUP BY normalized_status 
ORDER BY COUNT(*) DESC;

-- Check regional distribution
SELECT island, region, COUNT(*) 
FROM parcels 
GROUP BY island, region 
ORDER BY island, COUNT(*) DESC;

-- Check monthly distribution
SELECT month, COUNT(*) 
FROM parcels 
GROUP BY month 
ORDER BY month;
```

## File Structure

```
lib/
  └── supabase-migration.ts       # Migration logic
app/api/
  └── export-to-supabase/
      └── route.ts                # API endpoint
components/
  └── supabase-export-button.tsx  # UI component
```

## SQL File Contents

The generated SQL file includes:

1. **Table Schema** - Creates `parcels` table with all columns
2. **Indexes** - For fast queries
3. **Triggers** - Auto-update timestamps
4. **RLS Policies** - Security rules
5. **Data Inserts** - All your parcel records in batches
6. **Verification Queries** - To check data after import

## Estimated File Size

- **~500 bytes per record**
- **981 records = ~490 KB**
- **Very fast to download and import**

## Benefits of Supabase

### 1. Real-time Updates
- Subscribe to changes in real-time
- Perfect for live dashboards

### 2. Better Performance
- Indexed queries are MUCH faster than Google Sheets
- Can handle millions of records

### 3. Advanced Queries
- Complex SQL queries
- Joins, aggregations, window functions
- Full PostgreSQL power

### 4. API Access
- Auto-generated REST API
- Auto-generated GraphQL API
- Real-time subscriptions

### 5. Scalability
- No row limits (Google Sheets has 10M cell limit)
- Better for growing data

## Next Steps After Migration

### 1. Update Your App to Use Supabase

Instead of fetching from Google Sheets:

```typescript
// OLD: Google Sheets
const data = await processGoogleSheetsData()

// NEW: Supabase
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const { data, error } = await supabase
  .from('parcels')
  .select('*')
```

### 2. Keep Google Sheets as Backup

- Continue using Google Sheets for data entry
- Sync to Supabase periodically
- Or use Supabase directly for new entries

### 3. Add Real-time Features

```typescript
// Subscribe to new parcels
supabase
  .channel('parcels')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'parcels' },
    (payload) => {
      console.log('New parcel:', payload.new)
      // Update UI in real-time
    }
  )
  .subscribe()
```

## Troubleshooting

### Error: "relation parcels already exists"

The table already exists. Either:
1. Drop it first: `DROP TABLE parcels CASCADE;`
2. Or remove the `CREATE TABLE` section from SQL file

### Error: "permission denied"

Check your Supabase RLS policies. The default policy allows all operations.

### Data looks wrong

Verify the column mapping in `lib/supabase-migration.ts`:
- Check `convertToSupabaseFormat()` function
- Ensure Google Sheets columns match expected format

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Verify SQL syntax in SQL Editor
3. Check browser console for errors
4. Review the generated SQL file before running

## Summary

✅ **One-click export** from Google Sheets to Supabase  
✅ **All data preserved** - 981 parcels with full details  
✅ **Optimized schema** - Indexes, RLS, triggers included  
✅ **Ready to use** - Just download and run in Supabase  
✅ **Future-proof** - Scalable, fast, real-time capable  

**Estimated time: 5 minutes from download to fully imported database!**
