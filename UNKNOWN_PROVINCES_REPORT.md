# Unknown Provinces Report

## Overview

This report contains all parcels where the province could not be determined from the ADDRESS column.

---

## Data Collection

**Date Generated:** March 31, 2026
**Source:** Google Sheets ADDRESS column (Column C)
**Issue:** Province matching failed for municipality-only addresses

---

## Unknown Province Entries

### 1. Cagayan de Oro City
```
Address: PUROK 3 Riverview A Kware gusa, Gusa, Cagayan de Oro City
Expected:
  City: Cagayan de Oro
  Province: Misamis Oriental
  Region: Northern Mindanao (Region X)
Status: ❌ NOT MATCHED
```

### 2. Tagum City
```
Address: Apokon, Tagum City
Expected:
  City: Tagum
  Province: Davao del Norte
  Region: Davao Region (Region XI)
Status: ❌ NOT MATCHED
```

### 3. Balindong, Lanao del Sur
```
Address: Salipongan, Balindong
Expected:
  Municipality: Balindong
  Province: Lanao del Sur
  Region: BARMM
Status: ❌ NOT MATCHED
```

### 4. Bauang, La Union
```
Address: Bawanta, Bauang
Expected:
  Municipality: Bauang
  Province: La Union
  Region: Ilocos Region (Region I)
Status: ❌ NOT MATCHED
```

### 5. Kiblawan, Davao del Sur
```
Address: Balasiao, Kiblawan
Expected:
  Municipality: Kiblawan
  Province: Davao del Sur
  Region: Davao Region (Region XI)
Status: ❌ NOT MATCHED
```

### 6. Mabini, Davao de Oro
```
Address: Cadunan, Mabini (Davao de Oro)
Expected:
  Municipality: Mabini
  Province: Davao de Oro
  Region: Davao Region (Region XI)
Status: ❌ NOT MATCHED
```

### 7. Baloi, Lanao del Norte
```
Address: Baloi
Expected:
  Municipality: Baloi
  Province: Lanao del Norte
  Region: Northern Mindanao (Region X)
Status: ❌ NOT MATCHED
```

### 8. Guimba, Nueva Ecija
```
Address: San Roque, Guimba
Expected:
  Municipality: Guimba
  Province: Nueva Ecija
  Region: Central Luzon (Region III)
Status: ❌ NOT MATCHED
```

---

## Analysis

### Root Cause

**Problem:** Address format is "Barangay, Municipality" WITHOUT province name

Current system logic:
```typescript
// Extracts last 3 words only
const words = input.split(/\s+/).filter(w => w)
const regionText = words.slice(-3).join(' ')

// Example:
"Apokon, Tagum City" → Last 3 words: "APOKON TAGUM CITY"
// Tries to match "APOKON TAGUM CITY" but fails
// "Tagum City" is not in province database
```

### Common Patterns

1. **Barangay, Municipality** (no province)
   - "Apokon, Tagum City"
   - "Baloi"
   - "San Roque, Guimba"

2. **Barangay, Municipality (Province)** (province in parentheses)
   - "Cadunan, Mabini (Davao de Oro)"

3. **Long address with municipality only**
   - "PUROK 3 Riverview A Kware gusa, Gusa, Cagayan de Oro City"

### Missing Municipalities in Database

These municipalities are NOT in the province database:
- ❌ Balindong (Lanao del Sur)
- ❌ Bauang (La Union)
- ❌ Kiblawan (Davao del Sur)
- ❌ Mabini (Davao de Oro)
- ❌ Baloi (Lanao del Norte)
- ❌ Guimba (Nueva Ecija)

**Note:** Database only contains provinces and major cities, NOT all municipalities!

---

## Solutions

### Option 1: Add Municipality Database (RECOMMENDED)

Create comprehensive municipality-to-province mapping:

```typescript
const municipalityToProvince = {
  // Mindanao
  "TAGUM": { province: "Davao del Norte", region: "Region XI", island: "mindanao" },
  "BALINDONG": { province: "Lanao del Sur", region: "BARMM", island: "mindanao" },
  "KIBLAWAN": { province: "Davao del Sur", region: "Region XI", island: "mindanao" },
  "MABINI": { province: "Davao de Oro", region: "Region XI", island: "mindanao" },
  "BALOI": { province: "Lanao del Norte", region: "Region X", island: "mindanao" },
  
  // Luzon
  "BAUANG": { province: "La Union", region: "Region I", island: "luzon" },
  "GUIMBA": { province: "Nueva Ecija", region: "Region III", island: "luzon" },
  
  // Add more municipalities...
}
```

### Option 2: Enhanced Matching Logic

Update `determineRegion()` to:
1. Try full address match first
2. Try last 3 words (current)
3. Try last 2 words (municipality + city)
4. Try last 1 word (city/municipality only)

### Option 3: Require Province in Address

Update Google Sheets to include province:
- ❌ "Apokon, Tagum City"
- ✅ "Apokon, Tagum City, Davao del Norte"

---

## Recommendations

### Immediate Fix (Quick)

Add the 8 missing municipalities to the database:

```typescript
// In lib/philippine-regions.ts
"Region X": [
  // ... existing entries
  "Baloi",  // ← Add
],
"Region XI": [
  // ... existing entries
  "Tagum City",  // Already exists
  "Mabini",  // ← Add
  "Kiblawan",  // ← Add (under Davao del Sur)
],
"BARMM": [
  // ... existing entries
  "Balindong",  // ← Add
],
"Region I": [
  // ... existing entries
  "Bauang",  // ← Add
],
"Region III": [
  // ... existing entries
  "Guimba",  // ← Add
],
```

### Long-term Solution (Better)

Create comprehensive municipality database with 1,488 municipalities nationwide.

---

## Impact

### Current State
- **Total Unknown:** 8+ addresses
- **Success Rate:** ~95% (estimated)
- **Impact:** Minor data loss in reports

### After Fix
- **Total Unknown:** 0-2 addresses (edge cases only)
- **Success Rate:** ~99%
- **Impact:** Complete data coverage

---

## Next Steps

1. ✅ Document all unknown addresses
2. ⏳ Add missing municipalities to database
3. ⏳ Test with real data
4. ⏳ Verify all addresses are matched

---

**Status:** Analysis Complete - Ready for Implementation
