import { NextResponse } from "next/server"
import { fetchGoogleSheetsData, processGoogleSheetsDataInternal } from "@/lib/google-sheets-processor"
import { generateCompleteMigrationSQL, generateMigrationStats } from "@/lib/supabase-migration"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log("===========================================")
    console.log("MARCH DATA EXPORT STARTED")
    console.log("===========================================")
    console.log("Timestamp:", new Date().toISOString())
    
    // Fetch all data from Google Sheets
    const { sheetsData } = await fetchGoogleSheetsData()
    const data = processGoogleSheetsDataInternal(sheetsData)
    
    console.log("\n=== TOTAL DATA SUMMARY ===")
    console.log("Total records:", data.all.total)
    console.log("Total data array length:", data.all.data.length)
    
    // Show sample dates for debugging
    console.log("\n=== SAMPLE DATES (First 10) ===")
    data.all.data.slice(0, 10).forEach((parcel, index) => {
      console.log(`${index + 1}. Date: "${parcel.date}", Type: ${typeof parcel.date}`)
    })
    
    // Filter only March data
    const marchParcels = data.all.data.filter((parcel) => {
      if (!parcel.date) {
        return false
      }
      
      try {
        const dateStr = parcel.date.toString().trim()
        let parcelDate: Date | null = null
        
        // Try parsing as number (Excel serial date)
        const numDate = parseFloat(dateStr)
        if (!isNaN(numDate) && numDate.toString() === dateStr) {
          parcelDate = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000)
        } else {
          // Try parsing as regular date
          parcelDate = new Date(dateStr)
        }
        
        if (!parcelDate || isNaN(parcelDate.getTime())) {
          return false
        }
        
        // Check if month is March (month index 2)
        const month = parcelDate.getMonth()
        const year = parcelDate.getFullYear()
        
        // March of any year (2024, 2025, 2026, etc.)
        const isMarch = month === 2
        
        if (isMarch) {
          console.log(`✓ March date found: ${dateStr} -> ${parcelDate.toISOString()} (${year})`)
        }
        
        return isMarch
      } catch (error) {
        console.error("Error parsing date:", parcel.date, error)
        return false
      }
    })
    
    console.log("\n=== MARCH DATA SUMMARY ===")
    console.log("March records found:", marchParcels.length)
    
    if (marchParcels.length === 0) {
      console.log("\n⚠️ NO MARCH DATA FOUND")
      console.log("Possible reasons:")
      console.log("1. No March data in Google Sheets")
      console.log("2. Date format not recognized")
      console.log("3. Dates are in different format")
      
      return NextResponse.json({ 
        error: "No March data found",
        details: "Please check if your Google Sheets has March data and dates are properly formatted",
        totalRecords: data.all.total,
        sampleDates: data.all.data.slice(0, 5).map(p => p.date)
      }, { status: 400 })
    }
    
    // Show sample March dates
    console.log("\n=== SAMPLE MARCH DATES ===")
    marchParcels.slice(0, 10).forEach((parcel, index) => {
      console.log(`${index + 1}. Date: ${parcel.date}, Shipper: ${parcel.shipper}, Status: ${parcel.normalizedStatus}`)
    })
    
    // Generate migration SQL for March data only
    console.log("\n=== GENERATING MARCH SQL FILE ===")
    const migrationSQL = generateCompleteMigrationSQL(marchParcels)
    
    // Generate statistics
    const stats = generateMigrationStats(marchParcels)
    
    console.log("\n=== MARCH MIGRATION STATISTICS ===")
    console.log("Total March records:", stats.totalRecords)
    console.log("\nBy Status:")
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`)
    })
    console.log("\nBy Island:")
    Object.entries(stats.byIsland).forEach(([island, count]) => {
      console.log(`  - ${island}: ${count}`)
    })
    console.log("\nEstimated SQL file size:", stats.estimatedSize)
    console.log("\n===========================================")
    console.log("MARCH SQL GENERATED SUCCESSFULLY")
    console.log("===========================================")
    
    // Return SQL as downloadable file
    return new NextResponse(migrationSQL, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="rts-march-only-${Date.now()}.sql"`,
      },
    })
    
  } catch (error) {
    console.error("❌ Error generating March migration:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    
    return NextResponse.json({
      error: "Failed to generate March migration",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Get March data preview/stats without downloading
export async function GET() {
  try {
    console.log("Fetching March data statistics...")
    
    const { sheetsData } = await fetchGoogleSheetsData()
    const data = processGoogleSheetsDataInternal(sheetsData)
    
    console.log("Total records:", data.all.total)
    console.log("Sample dates:", data.all.data.slice(0, 5).map(p => ({ date: p.date, shipper: p.shipper })))
    
    // Filter only March data
    const marchParcels = data.all.data.filter((parcel) => {
      if (!parcel.date) return false
      
      try {
        const dateStr = parcel.date.toString().trim()
        let parcelDate: Date | null = null
        
        const numDate = parseFloat(dateStr)
        if (!isNaN(numDate) && numDate.toString() === dateStr) {
          parcelDate = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000)
        } else {
          parcelDate = new Date(dateStr)
        }
        
        if (!parcelDate || isNaN(parcelDate.getTime())) {
          return false
        }
        
        const month = parcelDate.getMonth()
        return month === 2 // March
      } catch {
        return false
      }
    })
    
    console.log("March records found:", marchParcels.length)
    
    if (marchParcels.length === 0) {
      return NextResponse.json({ 
        error: "No March data found",
        totalRecords: data.all.total,
        sampleDates: data.all.data.slice(0, 10).map(p => p.date),
        message: "No March data found in your Google Sheets. Please check if dates are properly formatted."
      }, { status: 400 })
    }
    
    const stats = generateMigrationStats(marchParcels)
    
    return NextResponse.json({
      success: true,
      stats,
      marchRecords: marchParcels.length,
      totalRecords: data.all.total,
      sampleMarchDates: marchParcels.slice(0, 5).map(p => ({ date: p.date, shipper: p.shipper })),
      message: `Ready to export ${marchParcels.length} March records to Supabase`
    })
    
  } catch (error) {
    console.error("Error fetching March stats:", error)
    return NextResponse.json({
      error: "Failed to fetch March stats",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
