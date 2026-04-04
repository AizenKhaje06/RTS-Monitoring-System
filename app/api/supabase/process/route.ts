import { NextRequest, NextResponse } from "next/server"
import { processSupabaseData } from "@/lib/supabase-processor"
import { dataCache } from "@/lib/cache"
import { generateTrendData, generatePredictiveInsights } from "@/lib/analytics"
import type { ProcessedData, ParcelData } from "@/lib/types"

// Server-side filter function
function applyFilter(data: ProcessedData, filter: { type: string; value: string }): ProcessedData {
  const filterParcelData = (parcels: ParcelData[]) => {
    return parcels.filter((parcel) => {
      if (filter.type === "province") {
        return parcel.province.toLowerCase().includes(filter.value.toLowerCase())
      }
      if (filter.type === "month") {
        if (!parcel.month) return false
        const monthStr = parcel.month.toLowerCase().trim()
        const filterMonth = Number.parseInt(filter.value, 10)
        const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
        const monthIndex = monthNames.findIndex(name => monthStr.includes(name))
        return monthIndex + 1 === filterMonth
      }
      if (filter.type === "year") {
        if (!parcel.date) return false
        const dateStr = parcel.date.toString().trim()
        let parcelYear = 0
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          parcelYear = d.getFullYear()
        } else {
          const datePart = dateStr.split(" ")[0]
          const parts = datePart.split("-")
          if (parts.length >= 3) {
            parcelYear = Number.parseInt(parts[0], 10)
          }
        }
        return parcelYear === Number.parseInt(filter.value, 10)
      }
      return true
    })
  }

  // Recalculate stats for filtered data
  const recalculateStats = (parcels: ParcelData[]) => {
    const STATUSES = ["DELIVERED", "ONDELIVERY", "PENDING", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED", "PENDING FULFILLED", "OTHER"]
    const stats: Record<string, { count: number; locations: Record<string, number> }> = {}
    const provinces: Record<string, number> = {}
    const regions: Record<string, number> = {}
    const winningShippers: Record<string, number> = {}
    const rtsShippers: Record<string, number> = {}

    STATUSES.forEach((status) => {
      stats[status] = { count: 0, locations: {} }
    })

    parcels.forEach((parcel) => {
      const status = parcel.normalizedStatus
      const province = parcel.province

      if (STATUSES.includes(status)) {
        stats[status].count++
        if (province && province !== "Unknown" && province.trim() !== "") {
          stats[status].locations[province] = (stats[status].locations[province] || 0) + 1
        }
      }

      if (province && province !== "Unknown" && province.trim() !== "") {
        provinces[province] = (provinces[province] || 0) + 1
      }
      regions[parcel.region] = (regions[parcel.region] || 0) + 1

      if (status === "DELIVERED") {
        winningShippers[parcel.shipper] = (winningShippers[parcel.shipper] || 0) + 1
      }

      if (status === "RETURNED") {
        rtsShippers[parcel.shipper] = (rtsShippers[parcel.shipper] || 0) + 1
      }
    })

    return { stats, provinces, regions, winningShippers, rtsShippers, total: parcels.length }
  }

  const filteredAll = filterParcelData(data.all.data)
  const filteredLuzon = filterParcelData(data.luzon.data)
  const filteredVisayas = filterParcelData(data.visayas.data)
  const filteredMindanao = filterParcelData(data.mindanao.data)

  const allStats = recalculateStats(filteredAll)
  const luzonStats = recalculateStats(filteredLuzon)
  const visayasStats = recalculateStats(filteredVisayas)
  const mindanaoStats = recalculateStats(filteredMindanao)

  return {
    all: { ...allStats, data: filteredAll },
    luzon: { ...luzonStats, data: filteredLuzon },
    visayas: { ...visayasStats, data: filteredVisayas },
    mindanao: { ...mindanaoStats, data: filteredMindanao },
  }
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { forceRefresh, filter } = body

    // Create cache key (include filter in cache key if present)
    const filterKey = filter ? `-${filter.type}-${filter.value}` : ''
    const cacheKey = `supabase-data${filterKey}`

    // Check cache unless force refresh is requested
    if (!forceRefresh) {
      const cachedData = dataCache.get(cacheKey)
      if (cachedData) {
        console.log("📦 Returning cached Supabase data")
        return NextResponse.json({ ...(cachedData as object), fromCache: true })
      }
    }

    console.log("📊 Fetching data from Supabase...")
    const data = await processSupabaseData()
    console.log(`✅ Successfully processed ${data.all.total} records from Supabase`)
    
    // Apply filter if provided
    let filteredData = data
    if (filter && filter.type !== 'all') {
      console.log("🔍 Applying filter:", filter)
      filteredData = applyFilter(data, filter)
    }

    // Pre-compute analytics on server to avoid sending large data arrays
    const trendData = {
      all: generateTrendData(filteredData.all.data),
      luzon: generateTrendData(filteredData.luzon.data),
      visayas: generateTrendData(filteredData.visayas.data),
      mindanao: generateTrendData(filteredData.mindanao.data),
    }

    const insights = generatePredictiveInsights(filteredData)

    // Optimize response by removing the full data arrays and adding pre-computed analytics
    const optimizedData = {
      all: {
        stats: filteredData.all.stats,
        provinces: filteredData.all.provinces,
        regions: filteredData.all.regions,
        total: filteredData.all.total,
        winningShippers: filteredData.all.winningShippers,
        rtsShippers: filteredData.all.rtsShippers,
        data: [], // Empty array for type compatibility
      },
      luzon: {
        stats: filteredData.luzon.stats,
        provinces: filteredData.luzon.provinces,
        regions: filteredData.luzon.regions,
        total: filteredData.luzon.total,
        winningShippers: filteredData.luzon.winningShippers,
        rtsShippers: filteredData.luzon.rtsShippers,
        data: [],
      },
      visayas: {
        stats: filteredData.visayas.stats,
        provinces: filteredData.visayas.provinces,
        regions: filteredData.visayas.regions,
        total: filteredData.visayas.total,
        winningShippers: filteredData.visayas.winningShippers,
        rtsShippers: filteredData.visayas.rtsShippers,
        data: [],
      },
      mindanao: {
        stats: filteredData.mindanao.stats,
        provinces: filteredData.mindanao.provinces,
        regions: filteredData.mindanao.regions,
        total: filteredData.mindanao.total,
        winningShippers: filteredData.mindanao.winningShippers,
        rtsShippers: filteredData.mindanao.rtsShippers,
        data: [],
      },
      // Add pre-computed analytics
      analytics: {
        trends: trendData,
        insights,
      },
    }

    // Cache the optimized data for 5 minutes (shorter than Google Sheets since Supabase is faster)
    dataCache.set(cacheKey, optimizedData, 5)

    return NextResponse.json({ ...optimizedData, fromCache: false })
  } catch (error) {
    console.error("❌ Error processing Supabase data:", error)
    return NextResponse.json({
      error: "Failed to process data from Supabase",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Add endpoint to clear cache
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    
    if (key) {
      dataCache.clear(key)
    } else {
      dataCache.clear()
    }
    
    return NextResponse.json({ success: true, message: "Cache cleared" })
  } catch (err) {
    console.error("Cache clear error:", err)
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 })
  }
}
