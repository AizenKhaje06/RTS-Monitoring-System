# Database Coverage Verification Guide

## Issue
User reports: "may mga name at address na nasa supabase pero wala naman sa gsheet"

## Possible Causes

### 1. Old Data Not Cleaned Up
If you previously imported data to Supabase and didn't drop the table before reimporting, old records may still exist.

**Solution**: Drop and recreate the table
```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS parcels CASCADE;
```
Then download a fresh SQL file and run it.

---

### 2. Multiple Imports
If you ran the SQL file multiple times, you'll have duplicate records.

**Check for duplicates**:
```sql
-- Count total records
SELECT COUNT(*) FROM parcels;

-- Check for duplicate records (same shipper, date, address)
SELECT 
  shipper_name, 
  parcel_date, 
  address, 
  COUNT(*) as duplicate_count
FROM parcels
GROUP BY shipper_name, parcel_date, address
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

**Solution**: Drop table and reimport once

---

### 3. Wrong Sheets Being Processed

**Current Sheet Filter Logic**:
- ✅ Includes: Sheets with month names (january-december) AND year (202X)
- ❌ Excludes: Sheets starting with "Sheet", "OTHER ORDER", "VENUS ORDER"

**Your Google Sheets tabs**:
- MARCH 2026 ✅ (will be processed)
- FEBRUARY 2026 ✅ (will be processed)
- APRIL 2026 ✅ (will be processed)
- OTHER ORDER ❌ (will be skipped)
- VENUS ORDER ❌ (will be skipped)

**Verify which sheets are being processed**:
1. Check server logs when you click "Export to Supabase"
2. Look for lines like:
   ```
   === SHEETS TO PROCESS ===
   Total sheets: 3
   1. "MARCH 2026" - 327 rows
   2. "FEBRUARY 2026" - 327 rows
   3. "APRIL 2026" - 327 rows
   ```

---

## Verification Steps

### Step 1: Check Supabase Record Count
```sql
-- Total records in Supabase
SELECT COUNT(*) FROM parcels;

-- Records per month
SELECT 
  TO_CHAR(parcel_date, 'YYYY-MM') as month,
  COUNT(*) as count
FROM parcels
GROUP BY TO_CHAR(parcel_date, 'YYYY-MM')
ORDER BY month;
```

**Expected Results** (based on your Google Sheets):
- Total: 981 parcels
- MARCH 2026: ~327 parcels
- FEBRUARY 2026: ~327 parcels
- APRIL 2026: ~327 parcels

If you see different numbers, there's a mismatch.

---

### Step 2: Check for Specific Records
If you found a name/address in Supabase that shouldn't be there:

```sql
-- Search by shipper name
SELECT * FROM parcels 
WHERE shipper_name ILIKE '%[name]%';

-- Search by address
SELECT * FROM parcels 
WHERE address ILIKE '%[address]%';

-- Check which month it's in
SELECT 
  shipper_name,
  address,
  parcel_date,
  TO_CHAR(parcel_date, 'YYYY-MM') as month
FROM parcels
WHERE shipper_name ILIKE '%[name]%';
```

---

### Step 3: Verify Google Sheets Data
1. Open your Google Sheets
2. Use Ctrl+F to search for the name/address
3. Check which tab it's in
4. Verify if that tab should be processed

---

### Step 4: Clean Import (Recommended)

To ensure a clean, accurate import:

1. **Drop existing table**:
```sql
DROP TABLE IF EXISTS parcels CASCADE;
```

2. **Download fresh SQL file**:
   - Go to your dashboard
   - Click "Insights" tab
   - Click "Export to Supabase"
   - Download the SQL file

3. **Check server logs** to verify which sheets were processed:
   - Look for "=== SHEETS TO PROCESS ===" in the console
   - Verify only MARCH 2026, FEBRUARY 2026, APRIL 2026 are listed

4. **Run the SQL file once** in Supabase SQL Editor

5. **Verify the import**:
```sql
-- Should be 981 total
SELECT COUNT(*) FROM parcels;

-- Check distribution
SELECT normalized_status, COUNT(*) 
FROM parcels 
GROUP BY normalized_status 
ORDER BY COUNT(*) DESC;
```

---

## Current System Behavior

### What Gets Processed
The system processes ALL rows from valid sheets (MARCH 2026, FEBRUARY 2026, APRIL 2026), including:
- Rows with blank status → mapped to "OTHER"
- Rows with unknown provinces → mapped to "Unknown" province
- Rows with any data in any column

### What Gets Skipped
- Completely empty rows (all cells empty)
- Sheets not matching month-year format
- Sheets named "OTHER ORDER" or "VENUS ORDER"

---

## Next Steps

1. Run the verification queries above
2. Check if total count matches (should be 981)
3. If count is wrong, drop table and reimport
4. If specific records are wrong, search for them in Google Sheets to verify
5. Share the results and we can investigate further

---

## Contact Number Issue (RESOLVED)
✅ Contact numbers are now being exported correctly from Column D
✅ If you see empty contact numbers, verify they exist in Column D of Google Sheets
