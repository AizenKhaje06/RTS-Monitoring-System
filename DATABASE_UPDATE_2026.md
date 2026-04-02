# Database Data Verification - Quick Guide

## Ang Problema
May mga name at address sa Supabase na wala sa Google Sheets.

## Mga Posibleng Dahilan

### 1. May Lumang Data Pa (Most Likely)
Kung nag-import ka na dati at hindi mo dinrop yung table, nandun pa yung lumang records.

**Solusyon**:
```sql
-- Sa Supabase SQL Editor, i-run ito:
DROP TABLE IF EXISTS parcels CASCADE;
```
Pagkatapos, download ulit ng bagong SQL file at i-run.

---

### 2. Nag-import ng Maraming Beses
Kung nag-run ka ng SQL file ng maraming beses, may duplicates.

**Check kung may duplicates**:
```sql
-- Total records
SELECT COUNT(*) FROM parcels;

-- Dapat 981 lang kung walang duplicates
-- Kung mas marami, may duplicates
```

---

### 3. Mali ang Sheets na Naproseso
Pero based sa code, tama naman:
- ✅ MARCH 2026 - processed
- ✅ FEBRUARY 2026 - processed  
- ✅ APRIL 2026 - processed
- ❌ OTHER ORDER - skipped
- ❌ VENUS ORDER - skipped

---

## Paano I-verify

### Step 1: Check Total Count
```sql
SELECT COUNT(*) FROM parcels;
```
**Dapat**: 981 records

Kung hindi 981, may problema.

---

### Step 2: Check Per Month
```sql
SELECT 
  TO_CHAR(parcel_date, 'YYYY-MM') as month,
  COUNT(*) as count
FROM parcels
GROUP BY TO_CHAR(parcel_date, 'YYYY-MM')
ORDER BY month;
```

**Dapat makita**:
- 2026-02: ~327 (February)
- 2026-03: ~327 (March)
- 2026-04: ~327 (April)

---

### Step 3: Search Specific Record
Kung may nakita kang name/address na hindi dapat nandun:

```sql
-- Search by name
SELECT * FROM parcels 
WHERE shipper_name ILIKE '%[pangalan]%';

-- Search by address
SELECT * FROM parcels 
WHERE address ILIKE '%[address]%';
```

Pagkatapos, i-check sa Google Sheets kung nandun ba talaga.

---

## Recommended: Clean Import

Para sigurado na tama ang data:

### 1. Drop existing table
```sql
DROP TABLE IF EXISTS parcels CASCADE;
```

### 2. Download fresh SQL file
- Go to dashboard
- Click "Insights" tab
- Click "Export to Supabase"
- Download SQL file

### 3. Check server logs
Tignan kung ano ang naproseso:
```
=== SHEETS TO PROCESS ===
Total sheets: 3
1. "MARCH 2026" - 327 rows
2. "FEBRUARY 2026" - 327 rows
3. "APRIL 2026" - 327 rows
```

Dapat 3 sheets lang (MARCH, FEBRUARY, APRIL).

### 4. Run SQL file ONCE
- Open Supabase SQL Editor
- Paste entire SQL file
- Click "Run"
- Wait for completion

### 5. Verify
```sql
-- Should be 981
SELECT COUNT(*) FROM parcels;

-- Check status distribution
SELECT normalized_status, COUNT(*) 
FROM parcels 
GROUP BY normalized_status 
ORDER BY COUNT(*) DESC;
```

---

## Ano ang Ginagawa ng System

### Ano ang Napoproseso
- Lahat ng rows sa MARCH 2026, FEBRUARY 2026, APRIL 2026
- Kahit blank ang status (magiging "OTHER")
- Kahit unknown ang province (magiging "Unknown")

### Ano ang Hindi Napoproseso
- Completely empty rows (walang laman lahat ng cells)
- OTHER ORDER sheet
- VENUS ORDER sheet
- Sheets na walang month name o year

---

## Enhanced Logging

Dinagdagan ko ng logging para mas madali i-debug:

Pag nag-export ka to Supabase, makikita mo sa server logs:
```
===========================================
SUPABASE MIGRATION EXPORT STARTED
===========================================

=== SHEETS TO PROCESS ===
Total sheets: 3
1. "MARCH 2026" - 327 rows
2. "FEBRUARY 2026" - 327 rows  
3. "APRIL 2026" - 327 rows

=== MIGRATION DATA SUMMARY ===
Total records: 981

=== MIGRATION STATISTICS ===
By Month:
  - MARCH 2026: 327
  - FEBRUARY 2026: 327
  - APRIL 2026: 327

By Status:
  - DELIVERED: 123
  - PENDING: 456
  ...
```

---

## Next Steps

1. Run yung verification queries sa taas
2. Check kung 981 ang total count
3. Kung mali, drop table at reimport
4. Kung may specific records na mali, search sa Google Sheets
5. Share mo sakin yung results para ma-investigate pa

---

## Note
✅ Contact numbers - working na
✅ Full address - working na
✅ Date format - YYYY-MM-DD na
✅ Sheet filtering - tama na (3 sheets lang)

Ang tanging possible issue na lang ay:
- Old data not cleaned up
- Multiple imports (duplicates)
