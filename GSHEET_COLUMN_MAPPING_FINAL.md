# Google Sheets Column Mapping - FINAL

## Your Google Sheets Headers (Confirmed)
```
A - DATE
B - NAME
C - ADDRESS
D - NUMBER
E - AMOUNT
F - ITEMS
G - TRACKING
H - STATUS
I - REASON
```

## System Mapping to Supabase

| Google Sheets | Column | Supabase Field | Status |
|---------------|--------|----------------|--------|
| DATE | A | parcel_date | ✅ Working |
| NAME | B | shipper_name | ✅ Working |
| ADDRESS | C | address | ✅ Working |
| NUMBER | D | contact_number | ⚠️ Check if data exists |
| AMOUNT | E | amount / cod_amount | ✅ Working |
| ITEMS | F | items | ⚠️ Check if data exists |
| TRACKING | G | tracking_number | ⚠️ Check if data exists |
| STATUS | H | status / normalized_status | ✅ Working |
| REASON | I | reason | ⚠️ Check if data exists |

## Updated Code

I've updated the column mapping to recognize "NUMBER" as the contact field.

## Next Steps

1. **Restart your local server** to apply the changes
2. **Export to Supabase** again
3. **Check server logs** - you should see:
   ```
   Column Mapping for "MARCH 2026":
     - Contact number column index: 3
     - Items column index: 5
     - Tracking column index: 6
     - Reason column index: 8
   
   Sample contact numbers (first 5):
     1. "09171234567"
     2. "(empty)"
     ...
   
   Sample items (first 5):
     1. "Shoes"
     2. "(empty)"
     ...
   
   Sample tracking numbers (first 5):
     1. "TRACK123"
     2. "(empty)"
     ...
   ```

4. **Verify in Google Sheets**:
   - Open Column D - do customers have contact numbers?
   - Open Column F - do parcels have items?
   - Open Column G - do parcels have tracking numbers?
   
   If these columns are empty in Google Sheets, then Supabase will also be empty (system working correctly).

## Important Note

If your Google Sheets columns D, F, G are actually empty, then:
- ✅ System is working correctly
- ❌ You need to add data to Google Sheets first

The system can only migrate data that exists in Google Sheets.
