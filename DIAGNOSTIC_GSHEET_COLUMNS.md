# Google Sheets Column Mapping Diagnostic

## Issue
Supabase shows:
- ✅ Shipper names populated
- ❌ Many contact numbers empty
- ❌ Items empty
- ❌ Tracking numbers empty

## Current Column Mapping (Expected)
```
A - DATE
B - NAME (shipper_name)
C - ADDRESS (address)
D - NUMBER (contact_number)
E - AMOUNT (amount)
F - ITEMS (items)
G - TRACKING (tracking_number)
H - STATUS (status)
I - REASON (reason)
```

## Diagnostic Steps

### Step 1: Verify Google Sheets Has Data

Open your Google Sheets and check:

1. **Column D (NUMBER)** - Do customers have contact numbers?
   - If empty in Google Sheets → System is working correctly
   - If has data in Google Sheets → System has a bug

2. **Column F (ITEMS)** - Do parcels have items listed?
   - If empty in Google Sheets → System is working correctly
   - If has data in Google Sheets → System has a bug

3. **Column G (TRACKING)** - Do parcels have tracking numbers?
   - If empty in Google Sheets → System is working correctly
   - If has data in Google Sheets → System has a bug

### Step 2: Check Server Logs

When you export to Supabase, check the server console logs for:

```
Column Mapping for "[SHEET NAME]":
  - Has headers detected: true/false
  - Status column index: 7
  - Date column index: 0
  - Shipper column index: 1
  - Address column index: 2
```

Look for these specific indices:
- Contact number index: should be 3 (Column D)
- Items index: should be 5 (Column F)
- Tracking index: should be 6 (Column G)

### Step 3: Check First Row Sample

The logs should show:
```
Header Row (first 12 columns):
  Column A (index 0): "DATE"
  Column B (index 1): "NAME"
  Column C (index 2): "ADDRESS"
  Column D (index 3): "NUMBER"
  Column E (index 4): "AMOUNT"
  Column F (index 5): "ITEMS"
  Column G (index 6): "TRACKING"
  Column H (index 7): "STATUS"
  Column I (index 8): "REASON"
```

### Step 4: Check Sample Data Rows

Logs should show first 5 rows with all 12 columns:
```
Row 2 (data row 1) - First 12 columns:
  Column A (index 0): "March 01"
  Column B (index 1): "Juan Dela Cruz"
  Column C (index 2): "123 Main St, Manila"
  Column D (index 3): "09171234567"  ← Should have contact
  Column E (index 4): "500"
  Column F (index 5): "Shoes"  ← Should have items
  Column G (index 6): "TRACK123"  ← Should have tracking
  Column H (index 7): "DELIVERED"
```

## Possible Causes

### Cause 1: Data Actually Empty in Google Sheets
If Columns D, F, G are actually empty in your Google Sheets, then the system is working correctly.

**Solution**: Add data to Google Sheets first

### Cause 2: Wrong Column Headers
If your Google Sheets headers are different from expected:
- "NUMBER" might be "CONTACT" or "PHONE"
- "ITEMS" might be "PRODUCT" or "DESCRIPTION"
- "TRACKING" might be "TRACKING NUMBER" or "AWB"

**Solution**: Update column mapping in code

### Cause 3: No Headers in Sheet
If your sheet doesn't have headers, the system uses positional mapping:
- Index 3 = Column D (contact)
- Index 5 = Column F (items)
- Index 6 = Column G (tracking)

**Solution**: Verify positional mapping is correct

### Cause 4: Data in Different Columns
Your actual data might be in different columns than expected.

**Solution**: Share screenshot of your Google Sheets headers

## Quick Test

Run this in your browser console while on the dashboard:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Export to Supabase"
4. Look for these log lines:

```
Column Mapping for "MARCH 2026":
  - Contact number column index: ?
  - Items column index: ?
  - Tracking column index: ?
```

Share the output with me.

## Next Steps

1. Check if data exists in Google Sheets Columns D, F, G
2. Share server logs when exporting
3. Share screenshot of Google Sheets headers (first row)
4. I'll fix the column mapping if needed
