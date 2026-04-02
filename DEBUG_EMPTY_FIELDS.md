# Debug Empty Fields in Supabase

## Issue
Supabase shows "EMPTY" for items and tracking_number columns, even though server logs show the data is being captured.

## Possible Causes

### 1. Empty Strings vs NULL
Supabase might be displaying empty strings `''` as "EMPTY". 

**Check in Supabase**:
```sql
-- Check if fields are NULL or empty strings
SELECT 
  id,
  shipper_name,
  items,
  tracking_number,
  CASE 
    WHEN items IS NULL THEN 'NULL'
    WHEN items = '' THEN 'EMPTY STRING'
    ELSE 'HAS DATA'
  END as items_status,
  CASE 
    WHEN tracking_number IS NULL THEN 'NULL'
    WHEN tracking_number = '' THEN 'EMPTY STRING'
    ELSE 'HAS DATA'
  END as tracking_status
FROM parcels
LIMIT 20;
```

### 2. Data Not Being Saved to ParcelData
The data might not be making it into the ParcelData objects.

**Check server logs** when exporting:
Look for lines like:
```
🔍 Sample ParcelData → Supabase conversion:
  Shipper: [name]
  Items: [items]
  Tracking: [tracking]
```

### 3. SQL File Has Empty Strings
The SQL file might actually have empty strings.

**Check the SQL file**:
1. Open the downloaded SQL file in a text editor
2. Search for a specific shipper name (e.g., "Nicole Binamira")
3. Look at the VALUES for that row
4. Check if items and tracking_number have values or are empty strings

Example of what you should see:
```sql
INSERT INTO parcels (...) VALUES
(
  '2026-04-01',
  'Nicole Binamira',  -- shipper_name
  'Door D Ruby Esteban Garcia Apartment...',  -- address
  '9858863135',  -- contact_number
  499.00,  -- amount
  '2 LIPO COLLA + FEM WASH',  -- items (should have data)
  'P1408HJAQZ1AV',  -- tracking_number (should have data)
  ...
)
```

If you see:
```sql
  '',  -- items (empty!)
  '',  -- tracking_number (empty!)
```

Then the data is not making it into the SQL file.

## Quick Test

Run this query in Supabase to see actual values:
```sql
-- Show first 10 records with their actual field values
SELECT 
  id,
  shipper_name,
  LENGTH(items) as items_length,
  LENGTH(tracking_number) as tracking_length,
  items,
  tracking_number
FROM parcels
WHERE id BETWEEN 15 AND 25
ORDER BY id;
```

This will show:
- If `items_length` = 0, it's an empty string
- If `items_length` = NULL, it's NULL
- If `items_length` > 0, it has data

## Next Steps

1. Run the SQL queries above
2. Check the downloaded SQL file for actual values
3. Check server logs for the conversion debug messages
4. Share the results so I can identify the exact issue
