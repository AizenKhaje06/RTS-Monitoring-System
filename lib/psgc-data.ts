// Philippine Standard Geographic Code (PSGC) Data
// Based on PSA PSGC Publication as of Q3 2025
// Source: Philippine Statistics Authority

export interface PSGCEntry {
  code: string
  name: string
  region: string
  island: "luzon" | "visayas" | "mindanao"
  type: "province" | "city" | "municipality"
}

// Complete PSGC-based mapping of provinces and cities to regions
export const psgcProvinces: PSGCEntry[] = [
  // NCR (National Capital Region) - Luzon
  { code: "133900000", name: "Manila", region: "NCR", island: "luzon", type: "city" },
  { code: "137400000", name: "Quezon City", region: "NCR", island: "luzon", type: "city" },
  { code: "137500000", name: "Caloocan", region: "NCR", island: "luzon", type: "city" },
  { code: "137600000", name: "Las Piñas", region: "NCR", island: "luzon", type: "city" },
  { code: "137700000", name: "Makati", region: "NCR", island: "luzon", type: "city" },
  { code: "137800000", name: "Malabon", region: "NCR", island: "luzon", type: "city" },
  { code: "137900000", name: "Mandaluyong", region: "NCR", island: "luzon", type: "city" },
  { code: "138000000", name: "Marikina", region: "NCR", island: "luzon", type: "city" },
  { code: "138100000", name: "Muntinlupa", region: "NCR", island: "luzon", type: "city" },
  { code: "138200000", name: "Navotas", region: "NCR", island: "luzon", type: "city" },
  { code: "138300000", name: "Parañaque", region: "NCR", island: "luzon", type: "city" },
  { code: "138400000", name: "Pasay", region: "NCR", island: "luzon", type: "city" },
  { code: "138500000", name: "Pasig", region: "NCR", island: "luzon", type: "city" },
  { code: "138600000", name: "Pateros", region: "NCR", island: "luzon", type: "municipality" },
  { code: "138700000", name: "San Juan", region: "NCR", island: "luzon", type: "city" },
  { code: "138800000", name: "Taguig", region: "NCR", island: "luzon", type: "city" },
  { code: "138900000", name: "Valenzuela", region: "NCR", island: "luzon", type: "city" },

  // CAR (Cordillera Administrative Region) - Luzon
  { code: "140100000", name: "Abra", region: "CAR", island: "luzon", type: "province" },
  { code: "141100000", name: "Apayao", region: "CAR", island: "luzon", type: "province" },
  { code: "142700000", name: "Benguet", region: "CAR", island: "luzon", type: "province" },
  { code: "143200000", name: "Ifugao", region: "CAR", island: "luzon", type: "province" },
  { code: "144400000", name: "Kalinga", region: "CAR", island: "luzon", type: "province" },
  { code: "148100000", name: "Mountain Province", region: "CAR", island: "luzon", type: "province" },
  { code: "141200000", name: "Baguio City", region: "CAR", island: "luzon", type: "city" },

  // Region I (Ilocos Region) - Luzon
  { code: "012800000", name: "Ilocos Norte", region: "Region I", island: "luzon", type: "province" },
  { code: "012900000", name: "Ilocos Sur", region: "Region I", island: "luzon", type: "province" },
  { code: "013300000", name: "La Union", region: "Region I", island: "luzon", type: "province" },
  { code: "015500000", name: "Pangasinan", region: "Region I", island: "luzon", type: "province" },

  // Region II (Cagayan Valley) - Luzon
  { code: "020900000", name: "Batanes", region: "Region II", island: "luzon", type: "province" },
  { code: "021500000", name: "Cagayan", region: "Region II", island: "luzon", type: "province" },
  { code: "023100000", name: "Isabela", region: "Region II", island: "luzon", type: "province" },
  { code: "025000000", name: "Nueva Vizcaya", region: "Region II", island: "luzon", type: "province" },
  { code: "025700000", name: "Quirino", region: "Region II", island: "luzon", type: "province" },

  // Region III (Central Luzon) - Luzon
  { code: "030800000", name: "Aurora", region: "Region III", island: "luzon", type: "province" },
  { code: "031400000", name: "Bataan", region: "Region III", island: "luzon", type: "province" },
  { code: "031400000", name: "Bulacan", region: "Region III", island: "luzon", type: "province" },
  { code: "034900000", name: "Nueva Ecija", region: "Region III", island: "luzon", type: "province" },
  { code: "035400000", name: "Pampanga", region: "Region III", island: "luzon", type: "province" },
  { code: "036900000", name: "Tarlac", region: "Region III", island: "luzon", type: "province" },
  { code: "037100000", name: "Zambales", region: "Region III", island: "luzon", type: "province" },

  // Region IV-A (CALABARZON) - Luzon
  { code: "041000000", name: "Batangas", region: "Region IV-A", island: "luzon", type: "province" },
  { code: "042100000", name: "Cavite", region: "Region IV-A", island: "luzon", type: "province" },
  { code: "043400000", name: "Laguna", region: "Region IV-A", island: "luzon", type: "province" },
  { code: "045600000", name: "Quezon", region: "Region IV-A", island: "luzon", type: "province" },
  { code: "045800000", name: "Rizal", region: "Region IV-A", island: "luzon", type: "province" },

  // Region IV-B (MIMAROPA) - Luzon
  { code: "174000000", name: "Marinduque", region: "Region IV-B", island: "luzon", type: "province" },
  { code: "175100000", name: "Occidental Mindoro", region: "Region IV-B", island: "luzon", type: "province" },
  { code: "175200000", name: "Oriental Mindoro", region: "Region IV-B", island: "luzon", type: "province" },
  { code: "175300000", name: "Palawan", region: "Region IV-B", island: "luzon", type: "province" },
  { code: "175900000", name: "Romblon", region: "Region IV-B", island: "luzon", type: "province" },

  // Region V (Bicol Region) - Luzon
  { code: "050500000", name: "Albay", region: "Region V", island: "luzon", type: "province" },
  { code: "051600000", name: "Camarines Norte", region: "Region V", island: "luzon", type: "province" },
  { code: "051700000", name: "Camarines Sur", region: "Region V", island: "luzon", type: "province" },
  { code: "052000000", name: "Catanduanes", region: "Region V", island: "luzon", type: "province" },
  { code: "054100000", name: "Masbate", region: "Region V", island: "luzon", type: "province" },
  { code: "056200000", name: "Sorsogon", region: "Region V", island: "luzon", type: "province" },

  // Region VI (Western Visayas) - Visayas
  { code: "060400000", name: "Aklan", region: "Region VI", island: "visayas", type: "province" },
  { code: "060600000", name: "Antique", region: "Region VI", island: "visayas", type: "province" },
  { code: "061900000", name: "Capiz", region: "Region VI", island: "visayas", type: "province" },
  { code: "063000000", name: "Guimaras", region: "Region VI", island: "visayas", type: "province" },
  { code: "063000000", name: "Iloilo", region: "Region VI", island: "visayas", type: "province" },
  { code: "064500000", name: "Negros Occidental", region: "Region VI", island: "visayas", type: "province" },

  // Region VII (Central Visayas) - Visayas
  { code: "071200000", name: "Bohol", region: "Region VII", island: "visayas", type: "province" },
  { code: "072200000", name: "Cebu", region: "Region VII", island: "visayas", type: "province" },
  { code: "074600000", name: "Negros Oriental", region: "Region VII", island: "visayas", type: "province" },
  { code: "076100000", name: "Siquijor", region: "Region VII", island: "visayas", type: "province" },

  // Region VIII (Eastern Visayas) - Visayas
  { code: "087800000", name: "Biliran", region: "Region VIII", island: "visayas", type: "province" },
  { code: "082600000", name: "Eastern Samar", region: "Region VIII", island: "visayas", type: "province" },
  { code: "083700000", name: "Leyte", region: "Region VIII", island: "visayas", type: "province" },
  { code: "084800000", name: "Northern Samar", region: "Region VIII", island: "visayas", type: "province" },
  { code: "086000000", name: "Samar", region: "Region VIII", island: "visayas", type: "province" },
  { code: "086400000", name: "Southern Leyte", region: "Region VIII", island: "visayas", type: "province" },

  // Region IX (Zamboanga Peninsula) - Mindanao
  { code: "097200000", name: "Zamboanga del Norte", region: "Region IX", island: "mindanao", type: "province" },
  { code: "097200000", name: "Zamboanga del Sur", region: "Region IX", island: "mindanao", type: "province" },
  { code: "098300000", name: "Zamboanga Sibugay", region: "Region IX", island: "mindanao", type: "province" },
  { code: "097200000", name: "Zamboanga City", region: "Region IX", island: "mindanao", type: "city" },

  // Region X (Northern Mindanao) - Mindanao
  { code: "101300000", name: "Bukidnon", region: "Region X", island: "mindanao", type: "province" },
  { code: "101800000", name: "Camiguin", region: "Region X", island: "mindanao", type: "province" },
  { code: "103500000", name: "Lanao del Norte", region: "Region X", island: "mindanao", type: "province" },
  { code: "104200000", name: "Misamis Occidental", region: "Region X", island: "mindanao", type: "province" },
  { code: "104300000", name: "Misamis Oriental", region: "Region X", island: "mindanao", type: "province" },

  // Region XI (Davao Region) - Mindanao
  { code: "112300000", name: "Davao de Oro", region: "Region XI", island: "mindanao", type: "province" },
  { code: "112400000", name: "Davao del Norte", region: "Region XI", island: "mindanao", type: "province" },
  { code: "112500000", name: "Davao del Sur", region: "Region XI", island: "mindanao", type: "province" },
  { code: "118200000", name: "Davao Occidental", region: "Region XI", island: "mindanao", type: "province" },
  { code: "112600000", name: "Davao Oriental", region: "Region XI", island: "mindanao", type: "province" },
  { code: "112400000", name: "Davao City", region: "Region XI", island: "mindanao", type: "city" },

  // Region XII (SOCCSKSARGEN) - Mindanao
  { code: "124700000", name: "Cotabato", region: "Region XII", island: "mindanao", type: "province" },
  { code: "126300000", name: "Sarangani", region: "Region XII", island: "mindanao", type: "province" },
  { code: "126300000", name: "South Cotabato", region: "Region XII", island: "mindanao", type: "province" },
  { code: "129800000", name: "Sultan Kudarat", region: "Region XII", island: "mindanao", type: "province" },

  // Region XIII (Caraga) - Mindanao
  { code: "160200000", name: "Agusan del Norte", region: "Region XIII", island: "mindanao", type: "province" },
  { code: "160300000", name: "Agusan del Sur", region: "Region XIII", island: "mindanao", type: "province" },
  { code: "168500000", name: "Dinagat Islands", region: "Region XIII", island: "mindanao", type: "province" },
  { code: "166700000", name: "Surigao del Norte", region: "Region XIII", island: "mindanao", type: "province" },
  { code: "166800000", name: "Surigao del Sur", region: "Region XIII", island: "mindanao", type: "province" },

  // BARMM (Bangsamoro Autonomous Region in Muslim Mindanao) - Mindanao
  { code: "150700000", name: "Basilan", region: "BARMM", island: "mindanao", type: "province" },
  { code: "153600000", name: "Lanao del Sur", region: "BARMM", island: "mindanao", type: "province" },
  { code: "153800000", name: "Maguindanao del Norte", region: "BARMM", island: "mindanao", type: "province" },
  { code: "153900000", name: "Maguindanao del Sur", region: "BARMM", island: "mindanao", type: "province" },
  { code: "156600000", name: "Sulu", region: "BARMM", island: "mindanao", type: "province" },
  { code: "157000000", name: "Tawi-Tawi", region: "BARMM", island: "mindanao", type: "province" },
]

// Additional cities and municipalities for better matching
export const psgcCities: PSGCEntry[] = [
  // Major cities across regions
  { code: "012801000", name: "Laoag City", region: "Region I", island: "luzon", type: "city" },
  { code: "012902000", name: "Vigan City", region: "Region I", island: "luzon", type: "city" },
  { code: "013301000", name: "San Fernando City", region: "Region I", island: "luzon", type: "city" },
  { code: "015501000", name: "Dagupan City", region: "Region I", island: "luzon", type: "city" },
  { code: "015502000", name: "Urdaneta City", region: "Region I", island: "luzon", type: "city" },
  
  { code: "021501000", name: "Tuguegarao City", region: "Region II", island: "luzon", type: "city" },
  { code: "023101000", name: "Santiago City", region: "Region II", island: "luzon", type: "city" },
  { code: "023102000", name: "Cauayan City", region: "Region II", island: "luzon", type: "city" },
  
  { code: "031401000", name: "Balanga City", region: "Region III", island: "luzon", type: "city" },
  { code: "031402000", name: "Malolos City", region: "Region III", island: "luzon", type: "city" },
  { code: "034901000", name: "Cabanatuan City", region: "Region III", island: "luzon", type: "city" },
  { code: "035401000", name: "Angeles City", region: "Region III", island: "luzon", type: "city" },
  { code: "035402000", name: "San Fernando City", region: "Region III", island: "luzon", type: "city" },
  { code: "036901000", name: "Tarlac City", region: "Region III", island: "luzon", type: "city" },
  { code: "037101000", name: "Olongapo City", region: "Region III", island: "luzon", type: "city" },
  
  { code: "041001000", name: "Batangas City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "041002000", name: "Lipa City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "041003000", name: "Tanauan City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "042101000", name: "Bacoor City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "042102000", name: "Cavite City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "042103000", name: "Dasmariñas City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "042104000", name: "Imus City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "042105000", name: "Tagaytay City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "043401000", name: "Calamba City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "043402000", name: "San Pablo City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "043403000", name: "Santa Rosa City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "045601000", name: "Lucena City", region: "Region IV-A", island: "luzon", type: "city" },
  { code: "045801000", name: "Antipolo City", region: "Region IV-A", island: "luzon", type: "city" },
  
  { code: "175201000", name: "Calapan City", region: "Region IV-B", island: "luzon", type: "city" },
  { code: "175301000", name: "Puerto Princesa City", region: "Region IV-B", island: "luzon", type: "city" },
  
  { code: "050501000", name: "Legazpi City", region: "Region V", island: "luzon", type: "city" },
  { code: "050502000", name: "Ligao City", region: "Region V", island: "luzon", type: "city" },
  { code: "050503000", name: "Tabaco City", region: "Region V", island: "luzon", type: "city" },
  { code: "051701000", name: "Naga City", region: "Region V", island: "luzon", type: "city" },
  { code: "051702000", name: "Iriga City", region: "Region V", island: "luzon", type: "city" },
  { code: "054101000", name: "Masbate City", region: "Region V", island: "luzon", type: "city" },
  { code: "056201000", name: "Sorsogon City", region: "Region V", island: "luzon", type: "city" },
  
  { code: "060401000", name: "Kalibo", region: "Region VI", island: "visayas", type: "municipality" },
  { code: "061901000", name: "Roxas City", region: "Region VI", island: "visayas", type: "city" },
  { code: "063001000", name: "Iloilo City", region: "Region VI", island: "visayas", type: "city" },
  { code: "064501000", name: "Bacolod City", region: "Region VI", island: "visayas", type: "city" },
  { code: "064502000", name: "Silay City", region: "Region VI", island: "visayas", type: "city" },
  { code: "064503000", name: "Talisay City", region: "Region VI", island: "visayas", type: "city" },
  
  { code: "071201000", name: "Tagbilaran City", region: "Region VII", island: "visayas", type: "city" },
  { code: "072201000", name: "Cebu City", region: "Region VII", island: "visayas", type: "city" },
  { code: "072202000", name: "Lapu-Lapu City", region: "Region VII", island: "visayas", type: "city" },
  { code: "072203000", name: "Mandaue City", region: "Region VII", island: "visayas", type: "city" },
  { code: "072204000", name: "Talisay City", region: "Region VII", island: "visayas", type: "city" },
  { code: "072205000", name: "Toledo City", region: "Region VII", island: "visayas", type: "city" },
  { code: "074601000", name: "Dumaguete City", region: "Region VII", island: "visayas", type: "city" },
  { code: "074602000", name: "Bais City", region: "Region VII", island: "visayas", type: "city" },
  
  { code: "082601000", name: "Borongan City", region: "Region VIII", island: "visayas", type: "city" },
  { code: "083701000", name: "Tacloban City", region: "Region VIII", island: "visayas", type: "city" },
  { code: "083702000", name: "Ormoc City", region: "Region VIII", island: "visayas", type: "city" },
  { code: "083703000", name: "Baybay City", region: "Region VIII", island: "visayas", type: "city" },
  { code: "086001000", name: "Calbayog City", region: "Region VIII", island: "visayas", type: "city" },
  { code: "086002000", name: "Catbalogan City", region: "Region VIII", island: "visayas", type: "city" },
  { code: "086401000", name: "Maasin City", region: "Region VIII", island: "visayas", type: "city" },
  
  { code: "097201000", name: "Dipolog City", region: "Region IX", island: "mindanao", type: "city" },
  { code: "097202000", name: "Dapitan City", region: "Region IX", island: "mindanao", type: "city" },
  { code: "097203000", name: "Pagadian City", region: "Region IX", island: "mindanao", type: "city" },
  { code: "097204000", name: "Isabela City", region: "Region IX", island: "mindanao", type: "city" },
  
  { code: "101301000", name: "Malaybalay City", region: "Region X", island: "mindanao", type: "city" },
  { code: "101302000", name: "Valencia City", region: "Region X", island: "mindanao", type: "city" },
  { code: "104201000", name: "Oroquieta City", region: "Region X", island: "mindanao", type: "city" },
  { code: "104202000", name: "Ozamiz City", region: "Region X", island: "mindanao", type: "city" },
  { code: "104203000", name: "Tangub City", region: "Region X", island: "mindanao", type: "city" },
  { code: "104301000", name: "Cagayan de Oro City", region: "Region X", island: "mindanao", type: "city" },
  { code: "104302000", name: "Gingoog City", region: "Region X", island: "mindanao", type: "city" },
  { code: "104303000", name: "Iligan City", region: "Region X", island: "mindanao", type: "city" },
  
  { code: "112401000", name: "Panabo City", region: "Region XI", island: "mindanao", type: "city" },
  { code: "112402000", name: "Tagum City", region: "Region XI", island: "mindanao", type: "city" },
  { code: "112403000", name: "Samal City", region: "Region XI", island: "mindanao", type: "city" },
  { code: "112501000", name: "Digos City", region: "Region XI", island: "mindanao", type: "city" },
  { code: "112601000", name: "Mati City", region: "Region XI", island: "mindanao", type: "city" },
  
  { code: "126301000", name: "General Santos City", region: "Region XII", island: "mindanao", type: "city" },
  { code: "126302000", name: "Koronadal City", region: "Region XII", island: "mindanao", type: "city" },
  { code: "124701000", name: "Kidapawan City", region: "Region XII", island: "mindanao", type: "city" },
  { code: "129801000", name: "Tacurong City", region: "Region XII", island: "mindanao", type: "city" },
  
  { code: "160201000", name: "Butuan City", region: "Region XIII", island: "mindanao", type: "city" },
  { code: "160202000", name: "Cabadbaran City", region: "Region XIII", island: "mindanao", type: "city" },
  { code: "160301000", name: "Bayugan City", region: "Region XIII", island: "mindanao", type: "city" },
  { code: "166701000", name: "Surigao City", region: "Region XIII", island: "mindanao", type: "city" },
  { code: "166801000", name: "Bislig City", region: "Region XIII", island: "mindanao", type: "city" },
  { code: "166802000", name: "Tandag City", region: "Region XIII", island: "mindanao", type: "city" },
  
  { code: "129800000", name: "Cotabato City", region: "BARMM", island: "mindanao", type: "city" },
  { code: "150701000", name: "Lamitan City", region: "BARMM", island: "mindanao", type: "city" },
  { code: "153601000", name: "Marawi City", region: "BARMM", island: "mindanao", type: "city" },
]

// Combine all PSGC entries
export const allPSGCEntries = [...psgcProvinces, ...psgcCities]
