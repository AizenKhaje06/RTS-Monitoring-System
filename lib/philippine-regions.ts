// Complete Philippine Regions and Provinces Database
export const philippineRegions = {
  luzon: {
    name: "Luzon",
    regions: ["NCR", "CAR", "Region I", "Region II", "Region III", "Region IV-A", "Region IV-B", "Region V"],
    provinces: {
      NCR: [
        "Manila",
        "Quezon City",
        "Caloocan",
        "Las Piñas",
        "Makati",
        "Malabon",
        "Mandaluyong",
        "Marikina",
        "Muntinlupa",
        "Navotas",
        "Parañaque",
        "Pasay",
        "Pasig",
        "Pateros",
        "San Juan",
        "Taguig",
        "Valenzuela",
      ],
      CAR: ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province", "Baguio City"],
      "Region I": [
        "Ilocos Norte",
        "Ilocos Sur",
        "La Union",
        "Pangasinan",
        "Dagupan City",
        "San Carlos City",
        "Alaminos City",
        "Urdaneta City",
        "Candon City",
        "Vigan City",
      ],
      "Region II": [
        "Batanes",
        "Cagayan",
        "Isabela",
        "Nueva Vizcaya",
        "Quirino",
        "Santiago City",
        "Tuguegarao City",
        "Cauayan City",
      ],
      "Region III": [
        "Aurora",
        "Bataan",
        "Bulacan",
        "Nueva Ecija",
        "Pampanga",
        "Tarlac",
        "Zambales",
        "Angeles City",
        "Olongapo City",
        "San Jose City",
        "Cabanatuan City",
        "Mabalacat City",
        "Malolos City",
        "Meycauayan City",
        "San Fernando City",
      ],
      "Region IV-A": [
        "Batangas",
        "Cavite",
        "Laguna",
        "Quezon",
        "Rizal",
        "Lucena City",
        "Antipolo City",
        "Bacoor City",
        "Calamba City",
        "San Pablo City",
        "Santa Rosa City",
        "Tanauan City",
        "Lipá City",
        "Batangas City",
        "Imus City",
        "Dasmariñas City",
        "General Trias City",
      ],
      "Region IV-B": [
        "Marinduque",
        "Occidental Mindoro",
        "Oriental Mindoro",
        "Palawan",
        "Romblon",
        "Puerto Princesa City",
        "Calapan City",
      ],
      "Region V": [
        "Albay",
        "Camarines Norte",
        "Camarines Sur",
        "Catanduanes",
        "Masbate",
        "Sorsogon",
        "Naga City",
        "Legazpi City",
        "Iriga City",
        "Sorsogon City",
        "Ligao City",
        "Tabaco City",
        "Masbate City",
      ],
    },
  },
  visayas: {
    name: "Visayas",
    regions: ["Region VI", "Region VII", "Region VIII"],
    provinces: {
      "Region VI": [
        "Aklan",
        "Antique",
        "Capiz",
        "Guimaras",
        "Iloilo",
        "Negros Occidental",
        "Bacolod City",
        "Iloilo City",
        "Roxas City",
        "San Carlos City",
        "Cadiz City",
        "Sagay City",
        "Silay City",
        "Talísay City",
        "Victorias City",
      ],
      "Region VII": [
        "Bohol",
        "Cebu",
        "Siquijor",
        "Negros Oriental",
        "Cebu City",
        "Lapu-Lapu City",
        "Mandaue City",
        "Talisay City",
        "Toledo City",
        "Dumaguete City",
        "Tagbilaran City",
        "Bais City",
        "Bayawan City",
        "Canlaon City",
        "Tanjay City",
      ],
      "Region VIII": [
        "Biliran",
        "Eastern Samar",
        "Leyte",
        "Northern Samar",
        "Samar",
        "Southern Leyte",
        "Ormoc City",
        "Tacloban City",
        "Calbayog City",
        "Catbalogan City",
        "Borongan City",
        "Baybay City",
        "Maasin City",
      ],
    },
  },
  mindanao: {
    name: "Mindanao",
    regions: ["Region IX", "Region X", "Region XI", "Region XII", "Region XIII", "BARMM"],
    provinces: {
      "Region IX": [
        "Zamboanga del Norte",
        "Zamboanga del Sur",
        "Zamboanga Sibugay",
        "Zamboanga City",
        "Isabela City",
        "Dapitan City",
        "Dipolog City",
        "Pagadian City",
      ],
      "Region X": [
        "Bukidnon",
        "Camiguin",
        "Lanao del Norte",
        "Misamis Occidental",
        "Misamis Oriental",
        "Cagayan de Oro City",
        "Iligan City",
        "El Salvador City",
        "Gingoog City",
        "Malaybalay City",
        "Valencia City",
        "Oroquieta City",
        "Ozamiz City",
        "Tangub City",
      ],
      "Region XI": [
        "Davao de Oro",
        "Davao del Norte",
        "Davao del Sur",
        "Davao Occidental",
        "Davao Oriental",
        "Davao City",
        "Panabo City",
        "Samal City",
        "Tagum City",
        "Digos City",
        "Mati City",
      ],
      "Region XII": [
        "Cotabato",
        "Sarangani",
        "South Cotabato",
        "Sultan Kudarat",
        "General Santos City",
        "Koronadal City",
        "Kidapawan City",
        "Tacurong City",
      ],
      "Region XIII": [
        "Agusan del Norte",
        "Agusan del Sur",
        "Dinagat Islands",
        "Surigao del Norte",
        "Surigao del Sur",
        "Butuan City",
        "Surigao City",
        "Bislig City",
        "Bayugan City",
        "Cabadbaran City",
        "Tandag City",
      ],
      BARMM: [
        "Basilan",
        "Lanao del Sur",
        "Maguindanao",
        "Sulu",
        "Tawi-Tawi",
        "Cotabato City",
        "Lamitan City",
        "Marawi City",
      ],
    },
  },
}

export type Island = "luzon" | "visayas" | "mindanao" | "unknown"

export interface RegionInfo {
  island: Island
  region: string
  province: string
}

export function determineRegion(consigneeRegion: string): RegionInfo {
  const regionText = (consigneeRegion || "").toUpperCase().trim()

  // Check for specific region matches first
  for (const [island, islandData] of Object.entries(philippineRegions)) {
    for (const [region, provinces] of Object.entries(islandData.provinces)) {
      for (const province of provinces) {
        if (regionText.includes(province.toUpperCase())) {
          return {
            island: island as Island,
            region: region,
            province: province,
          }
        }
      }
    }
  }

  // Fallback to simple text matching
  if (regionText.includes("LUZON") || regionText.includes("NCR") || regionText.includes("CAR")) {
    return { island: "luzon", region: "Unknown", province: "Unknown" }
  } else if (regionText.includes("VISAYAS")) {
    return { island: "visayas", region: "Unknown", province: "Unknown" }
  } else if (regionText.includes("MINDANAO")) {
    return { island: "mindanao", region: "Unknown", province: "Unknown" }
  }

  return { island: "unknown", region: "Unknown", province: "Unknown" }
}
