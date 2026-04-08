# How to Check "OTHER" Status Parcels

## Overview
May bagong feature na para makita mo kung ano yung mga raw status values na napunta sa "OTHER" category.

## Where to Find It

1. Go to **Parcel** page (main dashboard)
2. Click **"Enter Dashboard"** to load data
3. Click on **"Insights"** tab
4. Scroll down to **"OTHER Status Breakdown"** card

## What You'll See

### If No OTHER Parcels:
```
✅ No parcels with "OTHER" status found. 
All statuses are properly categorized!
```

### If May OTHER Parcels:
A detailed table showing:

| Column | Description |
|--------|-------------|
| **Raw Status Value** | Actual text from Google Sheets Column H |
| **Count** | How many parcels have this status |
| **% of OTHER** | Percentage of this status within OTHER category |
| **Top Provinces** | Which provinces have this status (top 3) |
| **Sample Tracking** | Sample tracking numbers (up to 3) |

## Example Output

```
Total parcels with "OTHER" status: 177

Raw Status Value    Count    % of OTHER    Top Provinces              Sample Tracking
(Empty)            150      84.7%         Sulu (11), Palawan (10)    TRK001, TRK002, TRK003
PROCESSING         15       8.5%          Cebu (8), Manila (7)       TRK100, TRK101, TRK102
SCHEDULED          8        4.5%          Davao (5), Iloilo (3)      TRK200, TRK201, TRK202
URGENT FULFILLED   4        2.3%          Quezon (4)                 TRK300, TRK301, TRK302
```

## How to Use This Information

### 1. Identify the Problem
- Look at the "Raw Status Value" column
- **(Empty)** means the status cell is blank in Google Sheets
- Other values show what non-standard status was used

### 2. Find the Parcels
- Use the **Sample Tracking** numbers to locate parcels in your Google Sheets
- Use Ctrl+F to search for these tracking numbers
- Check Column H (STATUS) for these rows

### 3. Fix the Source Data

#### For Empty Status:
```
1. Open Google Sheets
2. Find the tracking numbers shown
3. Fill in the correct status in Column H
4. Use one of: DELIVERED, ONDELIVERY, PENDING, INTRANSIT, 
   CANCELLED, DETAINED, PROBLEMATIC, RETURNED
```

#### For Non-Standard Status:
```
1. Decide which standard status it should be
   Example: "PROCESSING" → "PENDING"
            "SCHEDULED" → "PENDING"
            "URGENT FULFILLED" → "DELIVERED"
2. Replace all instances in Google Sheets
3. Use Find & Replace (Ctrl+H) for bulk updates
```

### 4. Prevent Future Issues

Add data validation to Column H:
```
1. Select Column H in Google Sheets
2. Data → Data validation
3. Criteria: List of items
4. Add these values:
   DELIVERED
   ONDELIVERY
   PENDING
   INTRANSIT
   CANCELLED
   DETAINED
   PROBLEMATIC
   RETURNED
5. Check "Reject input" for invalid data
6. Save
```

## Understanding the Results

### High Empty Count
```
(Empty): 150 parcels (84.7%)
```
**Problem:** Status column not filled in
**Solution:** Review data entry process, ensure status is always entered

### Multiple Non-Standard Values
```
PROCESSING: 15
SCHEDULED: 8
WAITING: 5
```
**Problem:** Using custom status values
**Solution:** Map these to standard statuses or add to normalization logic

### Province Concentration
```
Top Provinces: Sulu (11), Palawan (10)
```
**Problem:** Specific regions have data quality issues
**Solution:** Review data entry for these provinces specifically

## After Fixing

1. **Update Supabase** (if using)
   - Click "Export to Supabase" button
   - This will refresh the data with corrected statuses

2. **Reload Dashboard**
   - Click "Enter Dashboard" again
   - Check if OTHER count decreased

3. **Verify**
   - Go back to Insights tab
   - Check OTHER Status Breakdown
   - Should show fewer or zero parcels

## Benefits

✅ **Identify data quality issues** quickly
✅ **Locate problematic parcels** using tracking numbers
✅ **Track improvement** over time
✅ **Prevent future issues** with validation
✅ **Better reporting** with accurate status categorization

## Tips

- Run this check after each data import
- Monitor OTHER percentage (should be < 5%)
- Document any custom status mappings needed
- Train data entry staff on standard status values
- Use the sample tracking numbers to spot-check fixes
