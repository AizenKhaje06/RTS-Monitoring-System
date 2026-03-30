import { NextRequest, NextResponse } from "next/server"
import { processGoogleSheetsData } from "@/lib/google-sheets-processor"
import { dataCache } from "@/lib/cache"
import { generateTrendData, generatePredictiveInsights } from "@/lib/analytics"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, sheetName, forceRefresh } = await request.json()

    // Use the provided spreadsheetId or fall back to env variable
    const targetSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEET_ID

    if (!targetSpreadsheetId) {
      return NextResponse.json({ error: "No spreadsheet ID provided" }, { status: 400 })
    }

    // Create cache key
    const cacheKey = `processed-data-${targetSpreadsheetId}-${sheetName || 'all'}`

    // Check cache unless force refresh is requested
    if (!forceRefresh) {
      const cachedData = dataCache.get(cacheKey)
      if (cachedData) {
        console.log("Returning cached data for:", targetSpreadsheetId)
        return NextResponse.json({ ...(cachedData as object), fromCache: true })
      }
    }

    console.log("Processing Google Sheets data for spreadsheet:", targetSpreadsheetId)
    const data = await processGoogleSheetsData(targetSpreadsheetId, sheetName || undefined)
    console.log("Successfully processed data, total records:", data.all.total)

    // Pre-compute analytics on server to avoid sending large data arrays
    const trendData = {
      all: generateTrendData(data.all.data),
      luzon: generateTrendData(data.luzon.data),
      visayas: generateTrendData(data.visayas.data),
      mindanao: generateTrendData(data.mindanao.data),
    }

    const insights = generatePredictiveInsights(data)

    // Optimize response by removing the full data arrays and adding pre-computed analytics
    const optimizedData = {
      all: {
        stats: data.all.stats,
        provinces: data.all.provinces,
        regions: data.all.regions,
        total: data.all.total,
        winningShippers: data.all.winningShippers,
        rtsShippers: data.all.rtsShippers,
        data: [], // Empty array for type compatibility
      },
      luzon: {
        stats: data.luzon.stats,
        provinces: data.luzon.provinces,
        regions: data.luzon.regions,
        total: data.luzon.total,
        winningShippers: data.luzon.winningShippers,
        rtsShippers: data.luzon.rtsShippers,
        data: [],
      },
      visayas: {
        stats: data.visayas.stats,
        provinces: data.visayas.provinces,
        regions: data.visayas.regions,
        total: data.visayas.total,
        winningShippers: data.visayas.winningShippers,
        rtsShippers: data.visayas.rtsShippers,
        data: [],
      },
      mindanao: {
        stats: data.mindanao.stats,
        provinces: data.mindanao.provinces,
        regions: data.mindanao.regions,
        total: data.mindanao.total,
        winningShippers: data.mindanao.winningShippers,
        rtsShippers: data.mindanao.rtsShippers,
        data: [],
      },
      // Add pre-computed analytics
      analytics: {
        trends: trendData,
        insights,
      },
    }

    // Cache the optimized data for 30 minutes
    dataCache.set(cacheKey, optimizedData, 30)

    return NextResponse.json({ ...optimizedData, fromCache: false })
  } catch (error) {
    console.error("Error processing Google Sheets data:", error)
    return NextResponse.json({
      error: "Failed to process data",
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
