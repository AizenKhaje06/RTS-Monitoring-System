# Paano Kinukuha ang Province at Municipality

## Maikling Sagot
Ang system ay may **dalawang paraan** ng pagkuha ng data:

1. **Municipality** - Direktang kinukuha mula sa Google Sheets column
2. **Province** - Awtomatikong na-dedetermine base sa "Consignee Region" column gamit ang comprehensive Philippine regions database

---

## Detalyadong Paliwanag

### 1. MUNICIPALITY (Direktang Kinukuha)

#### Paano Kinukuha:
```
Google Sheets → MUNICIPALITY column → Direktang isasave
```

#### Proseso:
1. **May Header** - Hinahanap ang column na may "MUNICIPALITY" sa header
2. **Walang Header** - Hindi kinukuha (walang fallback position)
3. **Isasave as-is** - Kung ano ang nakasulat, yun ang isasave

#### Halimbawa:
```
| Consignee Region | Municipality  | Barangay |
|------------------|---------------|----------|
| Metro Manila     | Quezon City   | Brgy 1   |
| Cebu             | Cebu City     | Brgy 2   |
| Davao del Sur    | Davao City    | Brgy 3   |
```

**Result:**
- Municipality = "Quezon City" (direkta)
- Municipality = "Cebu City" (direkta)
- Municipality = "Davao City" (direkta)

---

### 2. PROVINCE (Awtomatikong Na-dedetermine)

#### Paano Kinukuha:
```
Google Sheets → CONSIGNEE REGION column → determineRegion() function → Province
```

#### Proseso (3 Steps):

**STEP 1: Kunin ang "Consignee Region" value**
```typescript
const consigneeRegionRaw = row[columnIndex] // e.g., "Metro Manila"
```

**STEP 2: I-normalize at i-extract ang last 3 words**
```typescript
const input = "Metro Manila".toUpperCase().trim()  // "METRO MANILA"
const words = input.split(/\s+/)                   // ["METRO", "MANILA"]
const regionText = words.slice(-3).join(' ')       // "METRO MANILA"
```

**STEP 3: I-match sa database (3 levels ng matching)**

#### Level 1: Region Name Matching (Priority)
Hinahanap kung ang text ay region name:

```typescript
const regionMappings = {
  "NCR": { island: "luzon", region: "NCR", province: "Metro Manila" },
  "METRO MANILA": { island: "luzon", region: "NCR", province: "Metro Manila" },
  "REGION IV-A": { island: "luzon", region: "Region IV-A" },
  "CALABARZON": { island: "luzon", region: "Region IV-A" },
  "REGION VII": { island: "visayas", region: "Region VII" },
  "CENTRAL VISAYAS": { island: "visayas", region: "Region VII" },
  // ... at iba pa
}
```

**Halimbawa:**
- Input: "NCR" → Province: "Metro Manila", Region: "NCR", Island: "Luzon"
- Input: "Region IV-A" → Province: "Unknown", Region: "Region IV-A", Island: "Luzon"

#### Level 2: Province Name Matching (Comprehensive)
Kung hindi region name, hinahanap sa database ng provinces:

```typescript
const philippineRegions = {
  luzon: {
    provinces: {
      NCR: ["Manila", "Quezon City", "Makati", ...],
      "Region IV-A": ["Batangas", "Cavite", "Laguna", ...],
      // ... lahat ng provinces
    }
  },
  visayas: {
    provinces: {
      "Region VII": ["Cebu", "Bohol", "Siquijor", ...],
      // ... lahat ng provinces
    }
  },
  mindanao: {
    provinces: {
      "Region XI": ["Davao del Sur", "Davao del Norte", ...],
      // ... lahat ng provinces
    }
  }
}
```

**Matching Process:**
```typescript
// Hinahanap kung ang input ay nag-match sa kahit anong province name
for (const province of allProvinces) {
  if (regionText.includes(province.toUpperCase())) {
    return { island, region, province }
  }
}
```

**Halimbawa:**
- Input: "Quezon City" → Province: "Quezon City", Region: "NCR", Island: "Luzon"
- Input: "Cebu" → Province: "Cebu", Region: "Region VII", Island: "Visayas"
- Input: "Davao del Sur" → Province: "Davao del Sur", Region: "Region XI", Island: "Mindanao"

#### Level 3: Island Keyword Matching (Fallback)
Kung hindi pa rin makita, hinahanap ang island keywords:

```typescript
if (regionText.includes("LUZON") || regionText.includes("MANILA")) {
  return { island: "luzon", region: "Unknown", province: "Unknown" }
}
if (regionText.includes("VISAYAS") || regionText.includes("CEBU")) {
  return { island: "visayas", region: "Unknown", province: "Unknown" }
}
if (regionText.includes("MINDANAO") || regionText.includes("DAVAO")) {
  return { island: "mindanao", region: "Unknown", province: "Unknown" }
}
```

---

## Mga Halimbawa ng Matching

### Halimbawa 1: Complete Address
```
Consignee Region: "Quezon City, Metro Manila"
```
**Proseso:**
1. Normalize: "QUEZON CITY, METRO MANILA"
2. Extract last 3 words: "CITY METRO MANILA"
3. Match: Nakita ang "METRO MANILA" sa regionMappings
4. **Result:**
   - Province: "Metro Manila"
   - Region: "NCR"
   - Island: "Luzon"

### Halimbawa 2: Province Only
```
Consignee Region: "Cebu"
```
**Proseso:**
1. Normalize: "CEBU"
2. Extract: "CEBU"
3. Match: Nakita ang "Cebu" sa Region VII provinces
4. **Result:**
   - Province: "Cebu"
   - Region: "Region VII"
   - Island: "Visayas"

### Halimbawa 3: Region Code
```
Consignee Region: "Region IV-A"
```
**Proseso:**
1. Normalize: "REGION IV-A"
2. Extract: "REGION IV-A"
3. Match: Nakita sa regionMappings
4. **Result:**
   - Province: "Unknown" (walang specific province)
   - Region: "Region IV-A"
   - Island: "Luzon"

### Halimbawa 4: City with Province
```
Consignee Region: "Davao City, Davao del Sur"
```
**Proseso:**
1. Normalize: "DAVAO CITY, DAVAO DEL SUR"
2. Extract last 3 words: "CITY DAVAO DEL SUR"
3. Match: Nakita ang "DAVAO DEL SUR" sa Region XI provinces
4. **Result:**
   - Province: "Davao del Sur"
   - Region: "Region XI"
   - Island: "Mindanao"

---

## Supported Province Names

### Luzon (8 Regions)
- **NCR**: Manila, Quezon City, Makati, Pasig, Taguig, etc. (17 cities)
- **CAR**: Baguio City, Benguet, Ifugao, etc. (7 provinces)
- **Region I**: Ilocos Norte, Ilocos Sur, La Union, Pangasinan (10 provinces/cities)
- **Region II**: Cagayan, Isabela, Nueva Vizcaya (8 provinces/cities)
- **Region III**: Bulacan, Pampanga, Tarlac, Zambales (15 provinces/cities)
- **Region IV-A**: Batangas, Cavite, Laguna, Quezon, Rizal (17 provinces/cities)
- **Region IV-B**: Palawan, Mindoro, Marinduque, Romblon (7 provinces/cities)
- **Region V**: Albay, Camarines Sur, Sorsogon, Masbate (13 provinces/cities)

### Visayas (3 Regions)
- **Region VI**: Iloilo, Aklan, Capiz, Negros Occidental (15 provinces/cities)
- **Region VII**: Cebu, Bohol, Negros Oriental, Siquijor (15 provinces/cities)
- **Region VIII**: Leyte, Samar, Eastern Samar, Biliran (13 provinces/cities)

### Mindanao (6 Regions)
- **Region IX**: Zamboanga del Norte, Zamboanga del Sur (8 provinces/cities)
- **Region X**: Bukidnon, Misamis Oriental, Cagayan de Oro (14 provinces/cities)
- **Region XI**: Davao del Sur, Davao del Norte, Davao City (11 provinces/cities)
- **Region XII**: South Cotabato, Sultan Kudarat, General Santos (9 provinces/cities)
- **Region XIII**: Agusan del Norte, Surigao del Norte, Butuan (11 provinces/cities)
- **BARMM**: Basilan, Lanao del Sur, Maguindanao, Sulu (8 provinces/cities)

**Total: 200+ provinces and cities supported!**

---

## Ano ang Mangyayari kung Hindi Makita?

### Kung Hindi Makita ang Province:
```typescript
if (regionInfo.province === "Unknown") {
  console.log("UNKNOWN PROVINCE PARCEL:", {
    sheetName: "JANUARY 2025",
    rowNumber: 15,
    rawInput: "Some Unknown Place",
    determinedProvince: "Unknown",
    determinedRegion: "Unknown",
    determinedIsland: "luzon" // Default to Luzon
  })
}
```

**Default Behavior:**
- Province: "Unknown"
- Region: "Unknown"
- Island: "luzon" (default para ma-count pa rin)

---

## Summary: Dalawang Paraan

### MUNICIPALITY
```
✅ Direktang kinukuha mula sa column
✅ Walang processing
✅ As-is ang value
```

### PROVINCE
```
✅ Awtomatikong na-dedetermine
✅ May 3 levels ng matching:
   1. Region name matching
   2. Province name matching
   3. Island keyword matching
✅ Gamit ang comprehensive database (200+ provinces/cities)
✅ Flexible - tumatanggap ng iba't ibang format
```

---

## Mga Tips para sa Tamang Mapping

### ✅ DAPAT:
1. Gumamit ng standard province names
2. Isulat ng maayos ang spelling
3. Pwedeng kasama ang city/municipality sa Consignee Region
4. Pwedeng region code lang (e.g., "NCR", "Region IV-A")

### ❌ HUWAG:
1. Gumamit ng abbreviations na hindi standard
2. Mag-typo sa province names
3. Gumamit ng foreign addresses
4. Iwanang blank ang Consignee Region

---

## Konklusyon

Ang system ay **matalino at flexible**:
- ✅ Tumatanggap ng iba't ibang format
- ✅ May comprehensive database ng Philippine provinces
- ✅ May fallback mechanisms
- ✅ Nag-lo-log ng unknown provinces para ma-fix

Basta may laman ang "Consignee Region" column, awtomatiko nang ma-dedetermine ang Province, Region, at Island! 🇵🇭
