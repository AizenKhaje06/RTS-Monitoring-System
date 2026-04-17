import { google } from "googleapis"
import type { sheets_v4, drive_v3 } from "googleapis"
import type { ProcessedData, RegionData, StatusCount, ParcelData } from "./types"
import { determineRegion as determineRegionFromLib } from "./philippine-regions"

export async function fetchGoogleSheetsData(spreadsheetId?: string, sheetName?: string): Promise<{ sheetsData: { data: unknown[][], name: string }[], sheetNames: string[] }> {
  console.log("Environment variables check:")
  console.log("GOOGLE_SHEETS_CLIENT_EMAIL:", process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? "Set" : "Not set")
  console.log("GOOGLE_SHEETS_PRIVATE_KEY:", process.env.GOOGLE_SHEETS_PRIVATE_KEY ? "Set" : "Not set")
  console.log("GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID ? "Set" : "Not set")

  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    throw new Error("Google Sheets service account credentials not configured")
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: "v4", auth })
  const targetSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEET_ID

  if (!targetSpreadsheetId) {
    throw new Error("No spreadsheet ID provided")
  }

  console.log("Fetching data from spreadsheet:", targetSpreadsheetId)

  try {
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: targetSpreadsheetId,
    })

    const sheetsList = spreadsheetResponse.data.sheets || []
    const sheetsData: { data: unknown[][], name: string }[] = []
    const sheetNames: string[] = []

    if (sheetName) {
      const range = `${sheetName}!A:Z`
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSpreadsheetId,
        range,
      })
      const sheetData = response.data.values || []
      if (sheetData.length > 0) {
        sheetsData.push({ data: sheetData, name: sheetName })
        sheetNames.push(sheetName)
      }
    } else {
      for (const sheet of sheetsList) {
        const sheetTitle = sheet.properties?.title || ""

        if (sheetTitle.toLowerCase().startsWith("sheet")) {
          console.log(`Skipping sheet: "${sheetTitle}" (starts with 'Sheet')`)
          continue
        }

        const hasMonthName = /january|february|march|april|may|june|july|august|september|october|november|december/i.test(sheetTitle)
        const hasYear = /202[0-9]/.test(sheetTitle)
        
        if (!hasMonthName || !hasYear) {
          console.log(`Skipping sheet: "${sheetTitle}" (not a month-year format)`)
          continue
        }

        console.log(`Processing sheet: "${sheetTitle}"`)

        const range = `${sheetTitle}!A:Z`
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: targetSpreadsheetId,
          range,
        })

        const sheetData = response.data.values || []

        if (sheetData.length > 0) {
          sheetsData.push({ data: sheetData, name: sheetTitle })
          sheetNames.push(sheetTitle)
        }
      }
    }

    return { sheetsData, sheetNames }
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error)
    throw new Error("Failed to fetch data from Google Sheets")
  }
}

export async function processGoogleSheetsData(spreadsheetId?: string, sheetName?: string): Promise<ProcessedData> {
  const { sheetsData } = await fetchGoogleSheetsData(spreadsheetId, sheetName)
  console.log("=== SHEETS TO PROCESS ===")
  console.log("Total sheets:", sheetsData.length)
  sheetsData.forEach((sheet, index) => {
    console.log(`${index + 1}. "${sheet.name}" - ${sheet.data.length} rows`)
  })
  console.log("========================")
  return processGoogleSheetsDataInternal(sheetsData)
}

// CLEAN REWRITE: Process Google Sheets data with simple, clear logic
export function processGoogleSheetsDataInternal(sheetsData: { data: unknown[][], name: string }[]): ProcessedData {
  const STATUSES = ["DELIVERED", "ONDELIVERY", "PENDING", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED", "PENDING FULFILLED", "OTHER"]
  
  const normalizeStatus = (rawStatus: string): string => {
    const normalized = rawStatus.toUpperCase().trim()

    if (normalized.includes("URGENT FULFILLED") || normalized === "CLOSED") return "OTHER"
    if (normalized.includes("PROBLEMATIC") || normalized.includes("PROBLEM")) return "PROBLEMATIC"
    if (normalized.includes("CANCELLED") || normalized.includes("CANCEL")) return "CANCELLED"
    if (normalized.includes("DETAINED") || normalized.includes("DETENTION")) return "DETAINED"
    if (normalized.includes("RETURNED") || normalized.includes("RETURN")) return "RETURNED"
    if (normalized.includes("ON-DELIVERY") || normalized.includes("ON DELIVERY") || normalized.includes("ONDELIVERY") || normalized.includes("OUT FOR DELIVERY")) return "ONDELIVERY"
    if (normalized.includes("DELIVERED") || normalized.includes("DELIVER")) return "DELIVERED"
    if (normalized.includes("PICKED-UP") || normalized.includes("PICKED UP") || normalized.includes("PICK-UP") || normalized.includes("PICK UP") || normalized.includes("PICKUP") || normalized.includes("FOR PICKUP")) return "PENDING"
    if (normalized.includes("IN-TRANSIT") || normalized.includes("IN TRANSIT") || normalized.includes("INTRANSIT") || normalized.includes("TRANSIT")) return "INTRANSIT"
    if (normalized.includes("PENDING FULFILLED")) return "PENDING FULFILLED"
    if (normalized.includes("PENDING")) return "PENDING"

    return "OTHER"
  }

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

  if (sheetsData.length === 0) return processedData

  // Process each sheet
  for (const sheet of sheetsData) {
    const sheetData = sheet.data
    const sheetName = sheet.name

    console.log(`\n=== Processing Sheet: "${sheetName}" ===`)

    if (sheetData.length === 0) {
      console.log(`  ⚠️ Sheet is empty, skipping...`)
      continue
    }

    // SIMPLE COLUMN MAPPING - Always use positional indices
    // Column A=DATE, B=NAME, C=ADDRESS, D=NUMBER, E=AMOUNT, F=ITEMS, G=TRACKING, H=STATUS, I=REASON
    const COL = {
      DATE: 0,
      NAME: 1,
      ADDRESS: 2,
      CONTACT: 3,
      AMOUNT: 4,
      ITEMS: 5,
      TRACKING: 6,
      STATUS: 7,
      REASON: 9  // Column J (index 9)
    }

    // Check if first row is header
    const firstRow = sheetData[0]
    const firstRowStr = firstRow.map((cell: unknown) => String(cell || "").toUpperCase())
    const isHeader = firstRowStr.some((cell: string) => 
      cell.includes("DATE") || cell.includes("NAME") || cell.includes("STATUS") || cell.includes("ADDRESS")
    )

    // Start from row 1 if header, row 0 if no header
    const startRow = isHeader ? 1 : 0
    
    console.log(`  First row is ${isHeader ? 'HEADER' : 'DATA'}`)
    console.log(`  Processing ${sheetData.length - startRow} data rows`)
    
    // Debug: Show first row
    if (isHeader) {
      console.log(`  Header: ${firstRowStr.slice(0, 9).join(' | ')}`)
    }

    let processedCount = 0

    // Process data rows
    for (let i = startRow; i < sheetData.length; i++) {
      const row = sheetData[i]
      
      // Skip empty rows
      if (!row || row.length === 0) continue
      const hasData = row.some((cell: unknown) => cell !== null && cell !== undefined && String(cell).trim() !== "")
      if (!hasData) continue

      // Extract data using simple column indices
      const date = String(row[COL.DATE] || "")
      const shipper = String(row[COL.NAME] || "")
      const fullAddress = String(row[COL.ADDRESS] || "")
      const contactNumber = String(row[COL.CONTACT] || "")
      const amount = parseFloat(String(row[COL.AMOUNT] || "0")) || 0
      const items = String(row[COL.ITEMS] || "")
      const tracking = String(row[COL.TRACKING] || "")
      const statusRaw = String(row[COL.STATUS] || "")
      const reason = String(row[COL.REASON] || "")

      const status = normalizeStatus(statusRaw)

      // Debug first 3 rows
      if (processedCount < 3) {
        console.log(`\n  Row ${i + 1}:`)
        console.log(`    Name: "${shipper}"`)
        console.log(`    Items: "${items}"`)
        console.log(`    Tracking: "${tracking}"`)
        console.log(`    Status: "${statusRaw}" → "${status}"`)
      }

      // Determine region
      const regionInfo = determineRegionFromLib(fullAddress)
      const island = regionInfo.island === "unknown" ? "luzon" : regionInfo.island

      const parcelData: ParcelData = {
        date,
        month: sheetName,
        status,
        normalizedStatus: status,
        shipper,
        consigneeRegion: regionInfo.region,
        fullAddress,
        contactNumber,
        items,
        tracking,
        reason,
        province: regionInfo.province,
        municipality: "",
        barangay: "",
        region: regionInfo.region,
        island,
        codAmount: amount,
        serviceCharge: 0,
        totalCost: amount,
        rtsFee: amount * 0.20,
      }
      
      // IMPORTANT: SHOPEE orders are excluded from all computations but still shown in table
      const isShopee = status === "SHOPEE"

      // Add to all data (including SHOPEE for display)
      processedData.all.data.push(parcelData)
      
      // Only count non-SHOPEE orders in totals
      if (!isShopee) {
        processedData.all.total++
      }

      // Add to island
      if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
        processedData[island as keyof typeof processedData].data.push(parcelData)
        
        // Only count non-SHOPEE orders in island totals
        if (!isShopee) {
          processedData[island as keyof typeof processedData].total++
        }
      }

      // Update province and region counts (exclude SHOPEE)
      if (!isShopee && regionInfo.province !== "Unknown") {
        processedData.all.provinces[regionInfo.province] = (processedData.all.provinces[regionInfo.province] || 0) + 1
        processedData.all.regions[regionInfo.region] = (processedData.all.regions[regionInfo.region] || 0) + 1

        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].provinces[regionInfo.province] =
            (processedData[island as keyof typeof processedData].provinces[regionInfo.province] || 0) + 1
          processedData[island as keyof typeof processedData].regions[regionInfo.region] =
            (processedData[island as keyof typeof processedData].regions[regionInfo.region] || 0) + 1
        }
      }

      // Update status counts (SHOPEE still gets counted in its own status)
      if (STATUSES.includes(status)) {
        processedData.all.stats[status].count++

        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].stats[status].count++
        }

        if (regionInfo.province !== "Unknown") {
          processedData.all.stats[status].locations[regionInfo.province] =
            (processedData.all.stats[status].locations[regionInfo.province] || 0) + 1
          if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
            processedData[island as keyof typeof processedData].stats[status].locations[regionInfo.province] =
              (processedData[island as keyof typeof processedData].stats[status].locations[regionInfo.province] || 0) + 1
          }
        }
      }

      // Update winning and RTS shippers (exclude SHOPEE)
      if (!isShopee && status === "DELIVERED") {
        processedData.all.winningShippers[shipper] = (processedData.all.winningShippers[shipper] || 0) + 1
        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].winningShippers[shipper] =
            (processedData[island as keyof typeof processedData].winningShippers[shipper] || 0) + 1
        }
      }

      const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
      if (!isShopee && rtsStatuses.includes(status)) {
        processedData.all.rtsShippers[shipper] = (processedData.all.rtsShippers[shipper] || 0) + 1
        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].rtsShippers[shipper] =
            (processedData[island as keyof typeof processedData].rtsShippers[shipper] || 0) + 1
        }
      }

      processedCount++
    }

    console.log(`  ✅ Processed ${processedCount} rows from "${sheetName}"`)
  }

  console.log(`\n=== FINAL SUMMARY (Excluding SHOPEE) ===`)
  console.log(`Total parcels: ${processedData.all.total}`)
  console.log(`  - Luzon: ${processedData.luzon.total}`)
  console.log(`  - Visayas: ${processedData.visayas.total}`)
  console.log(`  - Mindanao: ${processedData.mindanao.total}`)

  return processedData
}

export async function getUserSpreadsheets(accessToken: string): Promise<{ id: string; name: string }[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: "v3", auth })

  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(id,name)",
      orderBy: "modifiedTime desc",
    })

    return response.data.files?.map((file: drive_v3.Schema$File) => ({
      id: file.id!,
      name: file.name!,
    })) || []
  } catch (error) {
    console.error("Error fetching user spreadsheets:", error)
    throw new Error("Failed to fetch spreadsheets")
  }
}

export async function getSpreadsheetSheets(accessToken: string, spreadsheetId: string): Promise<{ name: string; index: number }[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const sheets = google.sheets({ version: "v4", auth })

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    return response.data.sheets?.map((sheet: sheets_v4.Schema$Sheet) => ({
      name: sheet.properties?.title || "",
      index: sheet.properties?.index || 0,
    })) || []
  } catch (error) {
    console.error("Error fetching spreadsheet sheets:", error)
    throw new Error("Failed to fetch sheets")
  }
}
