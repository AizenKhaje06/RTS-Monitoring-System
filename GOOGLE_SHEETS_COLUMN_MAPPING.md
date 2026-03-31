# Google Sheets Column Mapping Guide

## Overview
The RTS Monitoring System automatically maps columns from your Google Sheets to the application's data structure. It supports both **header-based** and **position-based** mapping for flexibility.

---

## How It Works

### 1. Header Detection (Automatic)
The system first checks if your sheet has headers by looking for these keywords in the first row:
- "DATE"
- "STATUS"
- "SHIPPER"

If found, it uses **intelligent header matching**.

### 2. Column Mapping Methods

#### Method A: Header-Based Mapping (Recommended)
The system searches for these header names (case-insensitive, partial match):

| Expected Header | Alternative Names | Maps To | Required |
|----------------|-------------------|---------|----------|
| **DATE** | Date, date | Parcel date | ✅ Yes |
| **STATUS** | Status, status | Delivery status | ✅ Yes |
| **SHIPPER** or **SHIPPER NAME** or **STORE** | Shipper, Store, Seller | Store/Shipper name | ✅ Yes |
| **CONSIGNEE REGION** | Region, Province, Consignee | Province/Region | ✅ Yes |
| **MUNICIPALITY** | Municipality, City | Municipality | ⚠️ Optional |
| **BARANGAY** | Barangay, Brgy | Barangay | ⚠️ Optional |
| **COD AMOUNT** | COD, Cash on Delivery | COD amount | ⚠️ Optional |
| **SERVICE CHARGE** | Service Fee, Charge | Service charge | ⚠️ Optional |
| **TOTAL COST** | Total, Shipping Cost | Total shipping cost | ⚠️ Optional |

**Example Header Row:**
```
Date | Status | Shipper Name | Consignee Region | Municipality | Barangay | COD Amount | Service Charge | Total Cost
```

#### Method B: Position-Based Mapping (Fallback)
If no headers are detected, the system uses fixed column positions:

| Column | Position | Maps To |
|--------|----------|---------|
| A | 0 | Date |
| D | 3 | Province/Consignee Region |
| E | 4 | Status |
| F | 5 | Shipper Name |
| H | 7 | COD Amount |
| I | 8 | Service Charge |
| J | 9 | Total Cost |

---

## Status Normalization

The system automatically normalizes various status formats to standard values:

| Your Status | Normalized To | Category |
|-------------|---------------|----------|
| Delivered, DELIVERED, deliver | **DELIVERED** | Success ✅ |
| On Delivery, OUT FOR DELIVERY, ONDELIVERY | **ONDELIVERY** | In Progress 🚚 |
| Pickup, PICK UP, FOR PICKUP | **PICKUP** | Pending 📦 |
| In Transit, INTRANSIT, TRANSIT | **INTRANSIT** | In Progress 🚛 |
| Cancelled, CANCEL | **CANCELLED** | Failed ❌ |
| Detained, DETENTION | **DETAINED** | Issue ⚠️ |
| Problematic, PROBLEM | **PROBLEMATIC** | Issue ⚠️ |
| Returned, RETURN, RTS | **RETURNED** | RTS 🔄 |
| Anything else | **OTHER** | Unknown ❓ |

---

## Shipper/Store Name Priority

The system prioritizes shipper identification in this order:
1. **SHIPPER NAME** column (highest priority)
2. **STORE** column
3. **SHIPPER** column (fallback)

---

## Financial Calculations

### Automatic Calculations:
- **RTS Fee** = Total Cost × 20% (automatically calculated)
- **Gross Profit** = Gross Sales - Total Shipping Cost - Service Charge
- **Net Profit** = Gross Profit - RTS Fee

### Required for Financial Reports:
- COD Amount (for delivered parcels)
- Service Charge
- Total Cost (shipping fee paid by seller)

---

## Sheet Name = Month

**Important:** The sheet name is used as the month identifier!

✅ **Good Sheet Names:**
- "JANUARY 2025"
- "JULY 2025"
- "December 2025"

❌ **Bad Sheet Names:**
- "Sheet1"
- "Data"
- "2025" (no month)

**Note:** Sheets without "2025" in the name are automatically skipped.

---

## Example Google Sheet Structure

### Option 1: With Headers (Recommended)
```
| Date       | Status    | Shipper Name | Consignee Region | Municipality | Barangay | COD Amount | Service Charge | Total Cost |
|------------|-----------|--------------|------------------|--------------|----------|------------|----------------|------------|
| 2025-01-15 | Delivered | Store ABC    | Metro Manila     | Quezon City  | Brgy 1   | 1500       | 50             | 100        |
| 2025-01-16 | Returned  | Store XYZ    | Cebu             | Cebu City    | Brgy 2   | 2000       | 60             | 120        |
```

### Option 2: Without Headers (Position-Based)
```
| A: Date    | B: ...    | C: ...       | D: Province      | E: Status    | F: Shipper | G: ...     | H: COD     | I: Service | J: Total |
|------------|-----------|--------------|------------------|--------------|------------|------------|------------|------------|----------|
| 2025-01-15 | ...       | ...          | Metro Manila     | Delivered    | Store ABC  | ...        | 1500       | 50         | 100      |
```

---

## Region/Province Mapping

The system automatically determines:
- **Island** (Luzon, Visayas, Mindanao)
- **Region** (NCR, Region I-XIII, CAR, BARMM)
- **Province** (from comprehensive Philippine regions database)

**Supported Formats:**
- "Metro Manila" → NCR, Luzon
- "Cebu" → Region VII, Visayas
- "Davao del Sur" → Region XI, Mindanao
- "NCR" → NCR, Luzon
- "Region IV-A" → CALABARZON, Luzon

---

## Best Practices

### ✅ DO:
1. Use clear, descriptive header names
2. Name sheets with month and year (e.g., "JANUARY 2025")
3. Keep column order consistent across sheets
4. Include all required columns (Date, Status, Shipper, Region)
5. Use standard Philippine province names

### ❌ DON'T:
1. Use generic sheet names like "Sheet1"
2. Mix different column orders between sheets
3. Leave required columns empty
4. Use non-standard province names
5. Include sheets without "2025" in the name (they'll be skipped)

---

## Troubleshooting

### Issue: "No data loaded"
**Solution:** Check that:
- Sheet names contain "2025"
- First row has recognizable headers OR data starts from row 1
- Required columns exist (Date, Status, Shipper, Region)

### Issue: "Unknown Province" in logs
**Solution:**
- Use standard Philippine province names
- Check spelling of province names
- Refer to `lib/philippine-regions.ts` for supported provinces

### Issue: Financial data shows zero
**Solution:**
- Ensure COD Amount, Service Charge, and Total Cost columns exist
- Check that values are numbers (not text)
- Verify column headers match expected names

---

## Configuration

Your Google Sheets configuration is in `.env.local`:

```env
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-spreadsheet-id-here
```

---

## Summary

The column mapping system is **flexible and intelligent**:
- ✅ Automatically detects headers
- ✅ Supports multiple column name variations
- ✅ Falls back to position-based mapping
- ✅ Normalizes status values
- ✅ Calculates financial metrics automatically
- ✅ Maps Philippine regions accurately

Just ensure your sheets have the required data, and the system handles the rest!
