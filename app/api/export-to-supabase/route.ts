import { NextRequest, NextResponse } from "next/server"
import { fetchGoogleSheetsData, processGoogleSheetsDataInternal } from "@/lib/google-sheets-processor"
import { generateCompleteMigrationSQL, generateMigrationStats } from "@/lib/supabase-migration"

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    console.log("===========================================")
    console.log("SUPABASE MIGRATION EXPORT STARTED")
    console.log("===========================================")
    console.log("Timestamp:", new Date().toISOString())
    
    // Fetch all data from Google Sheets - get the FULL data with arrays
    const { sheetsData } = await fetchGoogleSheetsData()
    const data = processGoogleSheetsDataInternal(sheetsData)
    
    console.log("\n=== MIGRATION DATA SUMMARY ===")
    console.log("Total records:", data.all.total)
    console.log("Luzon:", data.luzon.total)
    console.log("Visayas:", data.visayas.total)
    console.log("Mindanao:", data.mindanao.total)
    
    // Combine all parcel data from all regions
    const allParcels = data.all.data
    
    console.log("\n🔍 DEBUG: Checking first 3 parcels in allParcels array:")
    for (let i = 0; i < Math.min(3, allParcels.length); i++) {
      console.log(`\nParcel #${i + 1}:`)
      console.log(`  Shipper: "${allParcels[i].shipper}"`)
      console.log(`  Items: "${allParcels[i].items}"`)
      console.log(`  Tracking: "${allParcels[i].tracking}"`)
      console.log(`  Contact: "${allParcels[i].contactNumber}"`)
      console.log(`  Has items field: ${allParcels[i].hasOwnProperty('items')}`)
      console.log(`  Has tracking field: ${allParcels[i].hasOwnProperty('tracking')}`)
    }
    
    if (allParcels.length === 0) {
      return NextResponse.json({ 
        error: "No data found to export" 
      }, { status: 400 })
    }
    
    // Generate migration SQL
    console.log("\n=== GENERATING SQL FILE ===")
    const migrationSQL = generateCompleteMigrationSQL(allParcels)
    
    // Generate statistics
    const stats = generateMigrationStats(allParcels)
    
    console.log("\n=== MIGRATION STATISTICS ===")
    console.log("Total records to export:", stats.totalRecords)
    console.log("\nBy Month:")
    Object.entries(stats.byMonth).forEach(([month, count]) => {
      console.log(`  - ${month}: ${count}`)
    })
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
    console.log("MIGRATION SQL GENERATED SUCCESSFULLY")
    console.log("===========================================")
    
    // Return SQL as downloadable file
    return new NextResponse(migrationSQL, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="rts-supabase-migration-${Date.now()}.sql"`,
      },
    })
    
  } catch (error) {
    console.error("Error generating Supabase migration:", error)
    return NextResponse.json({
      error: "Failed to generate migration",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Get migration preview/stats without downloading
export async function GET(_request: NextRequest) {
  try {
    console.log("Fetching migration statistics...")
    
    const data = await processGoogleSheetsData()
    const allParcels = data.all.data
    
    if (allParcels.length === 0) {
      return NextResponse.json({ 
        error: "No data found" 
      }, { status: 400 })
    }
    
    const stats = generateMigrationStats(allParcels)
    
    return NextResponse.json({
      success: true,
      stats,
      message: "Ready to export to Supabase"
    })
    
  } catch (error) {
    console.error("Error fetching migration stats:", error)
    return NextResponse.json({
      error: "Failed to fetch stats",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
