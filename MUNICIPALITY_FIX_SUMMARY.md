# Municipality Data Fix

## Problem
Municipality column in Supabase was EMPTY even though the system shows municipality data.

## Root Cause
In `lib/google-sheets-processor.ts` line 245, municipality was hardcoded as empty string:
```typescript
municipality: "",  // ← Always empty!
```

## Solution Applied

### 1. Updated RegionInfo Interface
**File:** `lib/philippine-regions.ts`

Added municipality field:
```typescript
export interface RegionInfo {
  island: Island
  region: string
  province: string
  municipality?: string  // ← NEW
}
```

### 2. Extract Municipality from Address
**File:** `lib/philippine-regions.ts`

Added logic to extract municipality from comma-separated addresses:
```typescript
// Format: "Street, Municipality, Province"
let municipality: string | undefined = undefined

if (normalizedInput.includes(',')) {
  const parts = normalizedInput.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    municipality = parts[parts.length - 2]  // Second to last
  }
}
```

### 3. Updated Google Sheets Processor
**File:** `lib/google-sheets-processor.ts`

Changed from hardcoded empty to using extracted municipality:
```typescript
// Before:
municipality: "",

// After:
municipality: regionInfo.municipality || "",
```

### 4. Updated All Return Statements
**File:** `lib/philippine-regions.ts`

All return statements now include municipality:
```typescript
return {
  island: island,
  region: region,
  province: province,
  municipality,  // ← Added
}
```

## Impact

### Before Fix:
- System shows: "Davao-city", "Quezon-city", etc.
- Supabase shows: EMPTY for all municipality columns
- SQL exports have empty municipality values

### After Fix:
- System shows: "Davao-city", "Quezon-city", etc.
- Supabase will have: "Davao-city", "Quezon-city", etc.
- SQL exports will include municipality data

## How Municipality is Extracted

### Address Format Examples:
1. **"123 Main St, Davao-city, Davao del Sur"**
   - Municipality: "Davao-city"
   - Province: "Davao del Sur"

2. **"Quezon-city, Metro Manila"**
   - Municipality: "Quezon-city"
   - Province: "Metro Manila"

3. **"General-santos-city, South Cotabato"**
   - Municipality: "General-santos-city"
   - Province: "South Cotabato"

### Extraction Logic:
```
Split by comma → ["Street", "Municipality", "Province"]
                              ↑
                    Second to last part
```

## Testing

### To Verify Fix:
1. Re-export SQL from system
2. Check SQL file - municipality column should have data
3. Import to Supabase
4. Query: `SELECT province, municipality FROM parcels LIMIT 10`
5. Municipality column should show data

### Expected Results:
```sql
province          | municipality
------------------|-----------------
Davao del Sur     | Davao-city
Metro Manila      | Quezon-city
South Cotabato    | General-santos-city
Zamboanga del Sur | Zamboanga-city
```

## Files Modified

1. **lib/philippine-regions.ts**
   - Added municipality to RegionInfo interface
   - Added municipality extraction logic
   - Updated all return statements

2. **lib/google-sheets-processor.ts**
   - Changed municipality from "" to regionInfo.municipality

## Next Steps

1. **Re-export your data:**
   - Go to Parcel → Insights
   - Click "Download SQL File"
   - New export will include municipality data

2. **Import to Supabase:**
   - Open Supabase SQL Editor
   - Paste and run the new SQL file
   - Municipality column will now have data

3. **Verify:**
   - Check Supabase table editor
   - Municipality column should show cities/municipalities
   - System reports will match Supabase data

## Notes

- Municipality extraction works for comma-separated addresses
- If address doesn't have commas, municipality will be undefined
- This is backward compatible - existing code won't break
- Future exports will automatically include municipality data

## Status

✅ **FIXED** - Municipality data will now be included in SQL exports and Supabase imports.

---

**Date:** April 16, 2026
**Issue:** Municipality column empty in Supabase
**Resolution:** Extract municipality from address and include in exports
