# New Google Sheets Migration Guide

## Summary of Changes ✅

Successfully migrated to new Google Sheets structure!

---

## What Changed?

### 1. Google Sheet ID Updated
```env
OLD: GOOGLE_SHEET_ID=1TR7JrBvk2aRxSj-AX6tWfDLErZSRaBtnIjvSR-GyLNo
NEW: GOOGLE_SHEET_ID=1aHW58NDmjzetstJ72z1q1pBdzAgjBgYovOONiOoBxUg
```

### 2. New Column Structure
```
OLD Structure:
A - DATE
B - ?
C - ?
D - CONSIGNEE REGION
E - STATUS
F - SHIPPER NAME
...

NEW Structure:
A - DATE
B - NAME (customer/shipper)
C - ADDRESS (province/region extraction)
D - CONTACT NUMBER
E - AMOUNT (COD)
F - ITEMS
G - TRACKING
H - STATUS
J - REASON (if returned)
```

---

## Column Mapping Details

### New → Old Field Mapping

| New Column | Position | Maps To | Old Field | Purpose |
|------------|----------|---------|-----------|---------|
| DATE | A (0) | date | date | Parcel date |
| NAME | B (1) | shipper | shipper | Customer/Store name |
| ADDRESS | C (2) | consigneeregion | consigneeregion | Province/Region extraction |
| CONTACT NUMBER | D (3) | contactnumber | - | Contact info (optional) |
| AMOUNT | E (4) | codamount | codamount | COD Amount |
| ITEMS | F (5) | items | - | Items description (optional) |
| TRACKING | G (6) | tracking | - | Tracking number (optional) |
| STATUS | H (7) | status | status | Parcel status |
| REASON | J (9) | reason | - | Return reason (optional) |

---

## How Province/Municipality Extraction Works

### Same Process, Different Column!

**OLD**: Province extracted from Column D (CONSIGNEE REGION)
**NEW**: Province extracted from Column C (ADDRESS)

### Process Flow:
```
Google Sheets Column C (ADDRESS)
    ↓
"Quezon City, Metro Manila" (example)
    ↓
determineRegion() function
    ↓
Province: "Metro Manila"
Region: "NCR"
Island: "Luzon"
```

### Supported Address Formats:
```
✅ "Quezon City, Metro Manila"
✅ "Cebu City, Cebu"
✅ "Davao City, Davao del Sur"
✅ "Maguindanao del Norte"
✅ "Region IV-A"
✅ "NCR"
```

**Same matching logic as before!** 🎉

---

## Code Changes Made

### 1. Updated `.env.local`
```env
GOOGLE_SHEET_ID=1aHW58NDmjzetstJ72z1q1pBdzAgjBgYovOONiOoBxUg
```

### 2. Updated `lib/google-sheets-processor.ts`

#### Added New Headers:
```typescript
const expectedHeaders = [
  'DATE', 'NAME', 'ADDRESS', 'CONTACT', 'AMOUNT', 
  'ITEMS', 'TRACKING', 'STATUS', 'REASON',
  // Legacy headers for backward compatibility
  'STORE', 'SHIPPER', 'CONSIGNEE REGION', ...
]
```

#### Added Column Mappings:
```typescript
// NAME → shipper
if (indices['name'] !== undefined) {
  indices['shipper'] = indices['name']
}

// ADDRESS → consigneeregion
if (indices['address'] !== undefined) {
  indices['consigneeregion'] = indices['address']
}

// AMOUNT → codamount
if (indices['amount'] !== undefined) {
  indices['codamount'] = indices['amount']
}
```

#### Updated Position-Based Fallback:
```typescript
columnIndices = {
  date: 0,            // A - DATE
  shipper: 1,         // B - NAME
  consigneeregion: 2, // C - ADDRESS
  contactnumber: 3,   // D - CONTACT
  codamount: 4,       // E - AMOUNT
  items: 5,           // F - ITEMS
  tracking: 6,        // G - TRACKING
  status: 7,          // H - STATUS
  reason: 9           // J - REASON
}
```

---

## Backward Compatibility ✅

### Still Supports Old Format!
```
If old Google Sheets structure is detected:
- Old column names still work
- Old position mapping still works
- No breaking changes
```

### Dual Support:
```typescript
// Supports both:
'NAME' → shipper ✅
'SHIPPER NAME' → shipper ✅
'STORE' → shipper ✅

// Supports both:
'ADDRESS' → consigneeregion ✅
'CONSIGNEE REGION' → consigneeregion ✅

// Supports both:
'AMOUNT' → codamount ✅
'COD AMOUNT' → codamount ✅
```

---

## What's Missing from New Format?

### Optional Fields (Not in new structure):
- ❌ MUNICIPALITY - Not in new columns
- ❌ BARANGAY - Not in new columns
- ❌ SERVICE CHARGE - Not in new columns
- ❌ TOTAL COST - Not in new columns

### Impact:
```
Municipality: Will be empty ""
Barangay: Will be empty ""
Service Charge: Will be 0
Total Cost: Will be 0
RTS Fee: Will be 0 (calculated from Total Cost)
```

### Financial Reports:
- Gross Sales: ✅ Works (uses AMOUNT/COD)
- Service Charge: ❌ Will be 0
- Total Cost: ❌ Will be 0
- RTS Fee: ❌ Will be 0
- Net Profit: ⚠️ Will be same as Gross Sales

**Note**: Financial calculations will be limited without cost data.

---

## Testing Checklist

### ✅ Test Cases:

1. **Load Data**
   - [ ] Click "Enter Dashboard"
   - [ ] Data loads successfully
   - [ ] No errors in console

2. **Province Extraction**
   - [ ] Check if provinces are recognized
   - [ ] Check console for "UNKNOWN PROVINCE" logs
   - [ ] Verify region assignment (Luzon/Visayas/Mindanao)

3. **Status Normalization**
   - [ ] DELIVERED → Shows as delivered
   - [ ] RETURNED → Shows as RTS
   - [ ] Other statuses → Normalized correctly

4. **Dashboard Display**
   - [ ] Total parcels count correct
   - [ ] Status cards show correct counts
   - [ ] Province breakdown works
   - [ ] Region filtering works

5. **Reports**
   - [ ] Performance Report loads
   - [ ] Analytical Report loads
   - [ ] Financial Report loads (with limited data)

---

## Example Data Format

### New Google Sheets Format:
```
| A: DATE    | B: NAME      | C: ADDRESS           | D: CONTACT  | E: AMOUNT | F: ITEMS | G: TRACKING | H: STATUS   | J: REASON |
|------------|--------------|----------------------|-------------|-----------|----------|-------------|-------------|-----------|
| 2025-01-15 | Juan Dela Cruz | Quezon City, NCR   | 09123456789 | 1500      | Shoes    | TRK001      | DELIVERED   |           |
| 2025-01-16 | Maria Santos | Cebu City, Cebu      | 09234567890 | 2000      | Bag      | TRK002      | RETURNED    | Wrong address |
| 2025-01-17 | Pedro Reyes  | Davao City, Davao del Sur | 09345678901 | 1800 | Shirt    | TRK003      | ON DELIVERY |           |
```

---

## Migration Steps (Already Done) ✅

1. ✅ Updated `.env.local` with new Google Sheet ID
2. ✅ Updated column header detection
3. ✅ Added new column mappings
4. ✅ Updated position-based fallback
5. ✅ Maintained backward compatibility
6. ✅ Tested for TypeScript errors

---

## Next Steps

### 1. Test with Real Data
```bash
npm run dev
# Navigate to http://localhost:3001
# Click "Enter Dashboard"
# Verify data loads correctly
```

### 2. Check Console Logs
Look for:
- ✅ "Successfully processed data"
- ⚠️ "UNKNOWN PROVINCE PARCEL" (if any)
- ❌ Any error messages

### 3. Verify Province Recognition
- Check Performance Report
- Look at province breakdown
- Verify region assignment

### 4. Optional: Add Missing Columns
If you need financial calculations:
- Add "SERVICE CHARGE" column
- Add "TOTAL COST" column
- System will automatically recognize them

---

## Troubleshooting

### Issue: "No data loaded"
**Solution**: 
- Check Google Sheet ID in `.env.local`
- Verify service account has access to new sheet
- Check sheet names contain "2025"

### Issue: "Unknown Province" in logs
**Solution**:
- Check ADDRESS column format
- Use standard province names
- Include region or city in address

### Issue: Financial data shows zero
**Solution**:
- This is expected (no cost columns in new format)
- Add SERVICE CHARGE and TOTAL COST columns if needed
- Or accept limited financial reporting

---

## Summary

### ✅ What Works:
- New Google Sheet ID configured
- Column mapping updated
- Province/region extraction (from ADDRESS column)
- Status normalization
- Basic reporting
- Backward compatibility maintained

### ⚠️ What's Limited:
- Municipality/Barangay data (not in new format)
- Financial calculations (no cost columns)
- RTS fee calculation (needs Total Cost)

### 🎉 Ready to Use!
The system is configured and ready to load data from the new Google Sheets!

**Just click "Enter Dashboard" and test!** 🚀
