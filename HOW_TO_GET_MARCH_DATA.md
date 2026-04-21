# How to Get March Data Only

## Quick Steps

### Option 1: Using Python Script (Recommended)

1. **Download your full SQL export**
   - Go to your RTS system
   - Parcel → Insights → Download SQL File
   - Save as `full-export.sql`

2. **Run the filter script**
   ```bash
   python filter-march-data.py
   ```

3. **Get the result**
   - Output file: `march-only-export.sql`
   - Copy and paste to Supabase SQL Editor

### Option 2: Using the API Endpoint

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Open your browser and go to:**
   ```
   http://localhost:3000/api/export-march-only
   ```
   (This will download march-only SQL file)

3. **Or use curl:**
   ```bash
   curl -X POST http://localhost:3000/api/export-march-only -o march-data.sql
   ```

---

## Detailed Instructions

### Python Script Method

**Requirements:**
- Python 3.6 or higher

**Steps:**

1. Download full SQL from your system
2. Place `filter-march-data.py` in the same folder
3. Rename your SQL file to `full-export.sql` (or use custom name)
4. Run:
   ```bash
   # Default (looks for full-export.sql)
   python filter-march-data.py
   
   # Custom input/output files
   python filter-march-data.py my-data.sql march-output.sql
   ```

**What it does:**
- Reads your full SQL export
- Filters only March 2024, 2025, 2026 data
- Generates new SQL file with March data only
- Preserves table schema and structure

---

## What You'll Get

### March Data Includes:
- All March 2024 records
- All March 2025 records  
- All March 2026 records

### File Structure:
```sql
-- March Data Only Export
-- Generated: [timestamp]

DROP TABLE IF EXISTS parcels CASCADE;

CREATE TABLE parcels (
  -- full schema here
);

INSERT INTO parcels (...) VALUES
  -- March data only
;
```

---

## Troubleshooting

### Python script not working?
- Make sure Python is installed: `python --version`
- Check file name is exactly `full-export.sql`
- Check file is in same folder as script

### No March data found?
- Verify your Google Sheets has March data
- Check date format in your data
- Try opening the full SQL file to verify dates

### API endpoint not working?
- Make sure dev server is running
- Check port (default is 3000)
- Check browser console for errors

---

## Alternative: Manual Filtering

If scripts don't work, you can manually filter:

1. Open your full SQL file in a text editor
2. Search for March dates (e.g., "2024-03", "2025-03", "2026-03")
3. Copy only the INSERT statements with March dates
4. Keep the table schema at the top
5. Save as new file

---

## Need Help?

The Python script is the easiest method. Just:
1. Download full SQL
2. Run `python filter-march-data.py`
3. Done!

Output file will be ready to paste in Supabase.
