# Why Parcels Go to "OTHER" Status Category

## Overview
Ang "OTHER" status ay isang catch-all category para sa lahat ng parcels na hindi nag-match sa standard status values ng system.

## How Status Normalization Works

Ang system ay may `normalizeStatus()` function na nag-convert ng raw status text from Google Sheets into standardized status values. Ito ang order ng checking:

### Standard Status Matching (In Order)

1. **"URGENT FULFILLED" or "CLOSED"** → `OTHER`
2. **"PROBLEMATIC" or "PROBLEM"** → `PROBLEMATIC`
3. **"CANCELLED" or "CANCEL"** → `CANCELLED`
4. **"DETAINED" or "DETENTION"** → `DETAINED`
5. **"RETURNED" or "RETURN"** → `RETURNED`
6. **"ON-DELIVERY", "ON DELIVERY", "ONDELIVERY", "OUT FOR DELIVERY"** → `ONDELIVERY`
7. **"DELIVERED" or "DELIVER"** → `DELIVERED`
8. **"PICKED-UP", "PICKED UP", "PICK-UP", "PICK UP", "PICKUP", "FOR PICKUP"** → `PENDING`
9. **"IN-TRANSIT", "IN TRANSIT", "INTRANSIT", "TRANSIT"** → `INTRANSIT`
10. **"PENDING FULFILLED"** → `PENDING FULFILLED`
11. **"PENDING"** → `PENDING`
12. **Anything else** → `OTHER`

## Reasons Why Parcels Go to "OTHER"

### 1. **Empty or Blank Status**
```
Raw Status: "" (empty)
Result: OTHER
```
- Most common reason
- Status column (Column H) is empty in the sheet
- Example: MARCH 2026 sheet had empty status column

### 2. **Misspelled Status**
```
Raw Status: "DELIVERD" (missing E)
Result: OTHER
```
- Typos in status field
- "DELIVRED", "DELIEVERED", etc.

### 3. **Non-Standard Status Values**
```
Raw Status: "PROCESSING"
Result: OTHER

Raw Status: "SCHEDULED"
Result: OTHER

Raw Status: "WAITING"
Result: OTHER
```
- Custom status values not in the standard list
- Company-specific status codes

### 4. **Special Cases Already Mapped to OTHER**
```
Raw Status: "URGENT FULFILLED"
Result: OTHER (explicitly mapped)

Raw Status: "CLOSED"
Result: OTHER (explicitly mapped)
```

### 5. **Partial Matches That Don't Qualify**
```
Raw Status: "DELIV" (too short, doesn't contain "DELIVER")
Result: OTHER

Raw Status: "PEND" (doesn't match "PENDING")
Result: OTHER
```

### 6. **Status with Extra Characters**
```
Raw Status: "DELIVERED!!!"
Result: DELIVERED (✓ works because it contains "DELIVERED")

Raw Status: "***DELIVERED***"
Result: DELIVERED (✓ works)

Raw Status: "DEL-IVERED" (hyphen in wrong place)
Result: OTHER (doesn't match pattern)
```

### 7. **Foreign Language Status**
```
Raw Status: "ENTREGADO" (Spanish for delivered)
Result: OTHER

Raw Status: "配達済み" (Japanese for delivered)
Result: OTHER
```

### 8. **Numeric or Code-Based Status**
```
Raw Status: "001"
Result: OTHER

Raw Status: "STATUS_5"
Result: OTHER
```

## Examples from Your Data

Based on the screenshot showing "OTHER" with top provinces:
- **Sulu** (11 parcels)
- **Palawan** (10 parcels)
- **Cebu** (10 parcels)
- **Metro Manila** (8 parcels)
- **Basilan** (8 parcels)

This suggests that these parcels likely have:
- Empty status fields in the source data
- Non-standard status values specific to these regions
- Data entry issues in these provinces

## How to Identify What Went to OTHER

To see the actual raw status values that became "OTHER", you can:

1. **Check the source Google Sheet**
   - Look at Column H (STATUS) for these parcels
   - Filter by the provinces shown in the OTHER card

2. **Export the data**
   - Export parcels with "OTHER" status
   - Check the "Status" column to see original values

3. **Common patterns to look for:**
   - Completely empty cells
   - Unusual abbreviations
   - Status values in different languages
   - Custom company codes

## Impact

Parcels in "OTHER" status:
- ✅ Still counted in total parcels
- ✅ Still included in regional breakdowns
- ✅ Still included in financial calculations
- ⚠️ Cannot be filtered by specific status
- ⚠️ May indicate data quality issues
- ⚠️ Makes status-based reporting less accurate

## Recommendations to Reduce "OTHER" Parcels

### 1. **Standardize Status Values in Source Data**
Use only these values in your Google Sheets:
- DELIVERED
- ONDELIVERY (or ON-DELIVERY)
- PENDING (or PICKUP)
- INTRANSIT (or IN-TRANSIT)
- CANCELLED
- DETAINED
- PROBLEMATIC
- RETURNED
- PENDING FULFILLED

### 2. **Use Data Validation in Google Sheets**
Create a dropdown list in Column H with only allowed values:
```
Data → Data validation → List of items
DELIVERED, ONDELIVERY, PENDING, INTRANSIT, CANCELLED, DETAINED, PROBLEMATIC, RETURNED
```

### 3. **Fix Empty Status Cells**
- Review sheets with high "OTHER" counts
- Fill in missing status values
- Use formulas to auto-populate status if possible

### 4. **Add More Status Mappings**
If you have custom status values that are valid, you can add them to the `normalizeStatus()` function:
```typescript
if (normalized.includes("YOUR_CUSTOM_STATUS")) return "APPROPRIATE_CATEGORY"
```

### 5. **Regular Data Quality Checks**
- Monitor "OTHER" percentage over time
- Investigate when it exceeds 5-10% of total parcels
- Review and correct source data regularly

## Technical Details

**Function Location:** `lib/google-sheets-processor.ts`

**Normalization Logic:**
```typescript
const normalizeStatus = (rawStatus: string): string => {
  const normalized = rawStatus.toUpperCase().trim()
  
  // Check each pattern in order
  // If no match found, return "OTHER"
  
  return "OTHER"
}
```

**Case Insensitive:** All matching is done in UPPERCASE
**Trim Whitespace:** Leading/trailing spaces are removed
**Partial Match:** Uses `.includes()` so "DELIVERED!!!" still matches "DELIVERED"
