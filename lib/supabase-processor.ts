// Supabase Data Processor
// Fetches and processes data from Supabase instead of Google Sheets

import { supabase, type SupabaseParcel } from './supabase-client'
import type { ProcessedData, RegionData, StatusCount, ParcelData } from './types'

// Convert Supabase parcel to ParcelData format
function convertSupabaseToParcelData(sp: SupabaseParcel): ParcelData {
  // Extract month from parcel_date (e.g., "2026-03-15" → "MARCH 2026")
  const date = new Date(sp.parcel_date)
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                     'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
  
  // Extract municipality and province from address
  // Format: "123, Montalban, Rizal" → municipality="Montalban", province="Rizal"
  let municipality = sp.municipality || ''
  let province = sp.province
  
  if (sp.address && sp.address.includes(',')) {
    const parts = sp.address.split(',').map(p => p.trim()).filter(p => p.length > 0)
    
    if (parts.length >= 2) {
      // Last part is province
      province = parts[parts.length - 1]
      
      // Second to last is municipality
      if (parts.length >= 2) {
        municipality = parts[parts.length - 2]
      }
    }
  }
  
  return {
    date: sp.parcel_date,
    month,
    status: sp.status,
    normalizedStatus: sp.normalized_status,
    shipper: sp.shipper_name,
    consigneeRegion: sp.region,
    fullAddress: sp.address,
    contactNumber: sp.contact_number || '',
    items: sp.items || '',
    tracking: sp.tracking_number || '',
    reason: sp.reason || '',
    province: province,
    municipality: municipality,
    barangay: '',
    region: sp.region,
    island: sp.island,
    codAmount: sp.cod_amount,
    serviceCharge: sp.service_charge,
    totalCost: sp.total_cost,
    rtsFee: sp.rts_fee,
  }
}

// Fetch all parcels from Supabase
export async function fetchSupabaseData(): Promise<SupabaseParcel[]> {
  console.log('📊 Fetching data from Supabase...')
  
  const { data, error } = await supabase
    .from('parcels')
    .select('*')
    .order('parcel_date', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching from Supabase:', error)
    throw new Error(`Failed to fetch data from Supabase: ${error.message}`)
  }
  
  console.log(`✅ Fetched ${data?.length || 0} parcels from Supabase`)
  return data || []
}

// Process Supabase data into the same format as Google Sheets processor
export async function processSupabaseData(): Promise<ProcessedData> {
  const STATUSES = ["DELIVERED", "ONDELIVERY", "PENDING", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED", "PENDING FULFILLED", "OTHER"]
  
  const initializeRegionData = (): RegionData => {
    const stats: { [status: string]: StatusCount } = {}
    STATUSES.forEach((status) => {
      stats[status] = { count: 0, locations: {} }
    })

    return {
      data: [],
      stats,
      provinces: {},
      regions: {},
      total: 0,
      winningShippers: {},
      rtsShippers: {},
    }
  }

  const processedData = {
    all: initializeRegionData(),
    luzon: initializeRegionData(),
    visayas: initializeRegionData(),
    mindanao: initializeRegionData(),
  }

  // Fetch data from Supabase
  const supabaseParcels = await fetchSupabaseData()
  
  if (supabaseParcels.length === 0) {
    console.log('⚠️ No data found in Supabase')
    return processedData
  }

  console.log(`\n=== Processing ${supabaseParcels.length} parcels from Supabase ===`)

  // Process each parcel
  for (const sp of supabaseParcels) {
    const parcelData = convertSupabaseToParcelData(sp)
    const status = parcelData.normalizedStatus
    const island = parcelData.island

    // Add to all data
    processedData.all.data.push(parcelData)
    processedData.all.total++

    // Add to island
    if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
      processedData[island as keyof typeof processedData].data.push(parcelData)
      processedData[island as keyof typeof processedData].total++
    }

    // Update province and region counts
    if (parcelData.province !== "Unknown") {
      processedData.all.provinces[parcelData.province] = (processedData.all.provinces[parcelData.province] || 0) + 1
      processedData.all.regions[parcelData.region] = (processedData.all.regions[parcelData.region] || 0) + 1

      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].provinces[parcelData.province] =
          (processedData[island as keyof typeof processedData].provinces[parcelData.province] || 0) + 1
        processedData[island as keyof typeof processedData].regions[parcelData.region] =
          (processedData[island as keyof typeof processedData].regions[parcelData.region] || 0) + 1
      }
    }

    // Update status counts
    if (STATUSES.includes(status)) {
      processedData.all.stats[status].count++

      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].stats[status].count++
      }

      if (parcelData.province !== "Unknown") {
        processedData.all.stats[status].locations[parcelData.province] =
          (processedData.all.stats[status].locations[parcelData.province] || 0) + 1
        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].stats[status].locations[parcelData.province] =
            (processedData[island as keyof typeof processedData].stats[status].locations[parcelData.province] || 0) + 1
        }
      }
    }

    // Update winning and RTS shippers
    if (status === "DELIVERED") {
      processedData.all.winningShippers[parcelData.shipper] = (processedData.all.winningShippers[parcelData.shipper] || 0) + 1
      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].winningShippers[parcelData.shipper] =
          (processedData[island as keyof typeof processedData].winningShippers[parcelData.shipper] || 0) + 1
      }
    }

    const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
    if (rtsStatuses.includes(status)) {
      processedData.all.rtsShippers[parcelData.shipper] = (processedData.all.rtsShippers[parcelData.shipper] || 0) + 1
      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].rtsShippers[parcelData.shipper] =
          (processedData[island as keyof typeof processedData].rtsShippers[parcelData.shipper] || 0) + 1
      }
    }
  }

  console.log(`\n=== FINAL SUMMARY ===`)
  console.log(`Total parcels: ${processedData.all.total}`)
  console.log(`  - Luzon: ${processedData.luzon.total}`)
  console.log(`  - Visayas: ${processedData.visayas.total}`)
  console.log(`  - Mindanao: ${processedData.mindanao.total}`)

  return processedData
}

// Process Supabase data with full arrays (for exports, etc.)
export function processSupabaseDataInternal(supabaseParcels: SupabaseParcel[]): ProcessedData {
  const STATUSES = ["DELIVERED", "ONDELIVERY", "PENDING", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED", "PENDING FULFILLED", "OTHER"]
  
  const initializeRegionData = (): RegionData => {
    const stats: { [status: string]: StatusCount } = {}
    STATUSES.forEach((status) => {
      stats[status] = { count: 0, locations: {} }
    })

    return {
      data: [],
      stats,
      provinces: {},
      regions: {},
      total: 0,
      winningShippers: {},
      rtsShippers: {},
    }
  }

  const processedData = {
    all: initializeRegionData(),
    luzon: initializeRegionData(),
    visayas: initializeRegionData(),
    mindanao: initializeRegionData(),
  }

  // Process each parcel (same logic as above)
  for (const sp of supabaseParcels) {
    const parcelData = convertSupabaseToParcelData(sp)
    const status = parcelData.normalizedStatus
    const island = parcelData.island

    processedData.all.data.push(parcelData)
    processedData.all.total++

    if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
      processedData[island as keyof typeof processedData].data.push(parcelData)
      processedData[island as keyof typeof processedData].total++
    }

    if (parcelData.province !== "Unknown") {
      processedData.all.provinces[parcelData.province] = (processedData.all.provinces[parcelData.province] || 0) + 1
      processedData.all.regions[parcelData.region] = (processedData.all.regions[parcelData.region] || 0) + 1

      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].provinces[parcelData.province] =
          (processedData[island as keyof typeof processedData].provinces[parcelData.province] || 0) + 1
        processedData[island as keyof typeof processedData].regions[parcelData.region] =
          (processedData[island as keyof typeof processedData].regions[parcelData.region] || 0) + 1
      }
    }

    if (STATUSES.includes(status)) {
      processedData.all.stats[status].count++

      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].stats[status].count++
      }

      if (parcelData.province !== "Unknown") {
        processedData.all.stats[status].locations[parcelData.province] =
          (processedData.all.stats[status].locations[parcelData.province] || 0) + 1
        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].stats[status].locations[parcelData.province] =
            (processedData[island as keyof typeof processedData].stats[status].locations[parcelData.province] || 0) + 1
        }
      }
    }

    if (status === "DELIVERED") {
      processedData.all.winningShippers[parcelData.shipper] = (processedData.all.winningShippers[parcelData.shipper] || 0) + 1
      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].winningShippers[parcelData.shipper] =
          (processedData[island as keyof typeof processedData].winningShippers[parcelData.shipper] || 0) + 1
      }
    }

    const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
    if (rtsStatuses.includes(status)) {
      processedData.all.rtsShippers[parcelData.shipper] = (processedData.all.rtsShippers[parcelData.shipper] || 0) + 1
      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].rtsShippers[parcelData.shipper] =
          (processedData[island as keyof typeof processedData].rtsShippers[parcelData.shipper] || 0) + 1
      }
    }
  }

  return processedData
}
