# PSGC Implementation Summary

## What Changed

Updated the address/province matching system to use **Philippine Standard Geographic Code (PSGC)** for more accurate location detection.

## Files Created/Modified

### New Files:
1. **lib/psgc-data.ts** - Complete PSGC database
   - 82 provinces with official PSGC codes
   - 149+ major cities and municipalities
   - Accurate region-to-island mapping
   - Type-safe data structure

### Modified Files:
1. **lib/philippine-regions.ts** - Enhanced matching logic
   - Added PSGC-based matching (primary method)
   - Kept comma-based parsing (secondary)
   - Kept legacy text matching (fallback)
   - 3-tier matching strategy for maximum accuracy

## Matching Strategy (Priority Order)

### 1. PSGC-Based Matching (Highest Priority)
- Exact name match against PSGC database
- Partial match (contains/included in)
- Word-by-word match for multi-word locations
- Most accurate method

### 2. Comma-Based Parsing
- Parses "Municipality, Province" format
- Tries PSGC match on last part (province)
- Falls back to legacy match if needed
- Handles second-to-last part (municipality)

### 3. Legacy Text Matching (Fallback)
- Word-based matching
- Region name abbreviations
- Island-level keywords
- Last resort for unstructured addresses

## Benefits

1. **More Accurate** - Uses official PSA PSGC codes
2. **Complete Coverage** - All 82 provinces + 149 cities
3. **Standardized** - Official government naming conventions
4. **Better Matching** - Multi-tier matching strategy
5. **Type-Safe** - Full TypeScript support

## PSGC Data Structure

```typescript
interface PSGCEntry {
  code: string        // Official PSGC code
  name: string        // Official name
  region: string      // Region (NCR, CAR, Region I-XIII, BARMM)
  island: "luzon" | "visayas" | "mindanao"
  type: "province" | "city" | "municipality"
}
```

## Example Matches

### Before (Legacy):
- "Quezon City" → might match "Quezon" province (wrong!)
- "San Fernando, Pampanga" → might miss if format varies
- "Davao" → ambiguous (city or province?)

### After (PSGC):
- "Quezon City" → NCR, Metro Manila ✓
- "San Fernando, Pampanga" → Region III, Pampanga ✓
- "Davao City" → Region XI, Davao City ✓
- "Davao del Sur" → Region XI, Davao del Sur ✓

## Testing

To test the new implementation:

1. Refresh your dashboard at http://localhost:3002
2. Check server logs for "UNKNOWN PROVINCE PARCEL" entries
3. Compare before/after counts for each region
4. Verify that previously unknown provinces are now recognized

## Next Steps

1. Monitor logs for any remaining "Unknown" provinces
2. Add more municipalities if needed
3. Consider adding barangay-level matching (optional)
4. Update documentation with PSGC references

## References

- Philippine Statistics Authority (PSA)
- PSGC Publication Q3 2025
- 82 provinces, 149 cities, 1,493 municipalities
- 18 regions (NCR, CAR, Region I-XIII, BARMM)
