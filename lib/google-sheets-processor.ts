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
    // Get spreadsheet metadata to find all sheets
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: targetSpreadsheetId,
    })

    const sheetsList = spreadsheetResponse.data.sheets || []

    const sheetsData: { data: unknown[][], name: string }[] = []
    const sheetNames: string[] = []

    if (sheetName) {
      // Fetch specific sheet
      const range = `${sheetName}!A:Z` // Adjust range as needed
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
      // Process each sheet separately to maintain accurate per-sheet counts
      for (const sheet of sheetsList) {
        const sheetTitle = sheet.properties?.title || ""

        // Skip sheets that start with "Sheet" (case-insensitive)
        if (sheetTitle.toLowerCase().startsWith("sheet")) {
          continue
        }

        // Skip sheets that do not contain "2025" or "2026" in their title
        if (!sheetTitle.includes("2025") && !sheetTitle.includes("2026")) {
          continue
        }

        const range = `${sheetTitle}!A:Z`
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: targetSpreadsheetId,
          range,
        })

        const sheetData = response.data.values || []

        if (sheetData.length > 0) {
          // Store each sheet's data separately with its name
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
  return processGoogleSheetsDataInternal(sheetsData)
}

function processGoogleSheetsDataInternal(sheetsData: { data: unknown[][], name: string }[]): ProcessedData {
  const STATUSES = ["DELIVERED", "ONDELIVERY", "PICKUP", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED"]

  const normalizeStatus = (rawStatus: string): string => {
    const normalized = rawStatus.toUpperCase().trim()

    // Use includes() for more flexible matching - order matters for specificity
    // More specific/problematic statuses first
    if (normalized.includes("PROBLEMATIC") || normalized.includes("PROBLEM")) return "PROBLEMATIC"
    if (normalized.includes("CANCELLED") || normalized.includes("CANCEL")) return "CANCELLED"
    if (normalized.includes("DETAINED") || normalized.includes("DETENTION")) return "DETAINED"
    if (normalized.includes("RETURNED") || normalized.includes("RETURN")) return "RETURNED"
    if (normalized.includes("ON DELIVERY") || normalized.includes("ONDELIVERY") || normalized.includes("OUT FOR DELIVERY")) return "ONDELIVERY"
    if (normalized.includes("DELIVERED") || normalized.includes("DELIVER")) return "DELIVERED"
    if (normalized.includes("PICK UP") || normalized.includes("PICKUP") || normalized.includes("PICKED UP") || normalized.includes("FOR PICKUP")) return "PICKUP"
    if (normalized.includes("IN TRANSIT") || normalized.includes("INTRANSIT") || normalized.includes("TRANSIT")) return "INTRANSIT"

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

  const determineRegion = (province: string): { province: string; region: string; island: string } => {
    // Use the comprehensive region determination from philippine-regions.ts
    const regionInfo = determineRegionFromLib(province)

    return {
      province: regionInfo.province,
      region: regionInfo.region,
      island: regionInfo.island,
    }
  }

  // Function to find column indices by header names
  const findColumnIndices = (headers: string[]): { [key: string]: number } => {
    const indices: { [key: string]: number } = {}
    const expectedHeaders = [
      'DATE', 'NAME', 'ADDRESS', 'CONTACT', 'AMOUNT', 'ITEMS', 'TRACKING', 'STATUS', 'REASON',
      // Legacy headers for backward compatibility
      'STORE', 'SHIPPER', 'SHIPPER NAME', 'CONSIGNEE REGION',
      'MUNICIPALITY', 'BARANGAY', 'COD AMOUNT', 'SERVICE CHARGE', 'TOTAL COST'
    ]

    headers.forEach((header, index) => {
      const normalizedHeader = header?.toString().toUpperCase().trim()
      expectedHeaders.forEach(expected => {
        if (normalizedHeader?.includes(expected) || expected.includes(normalizedHeader)) {
          indices[expected.toLowerCase().replace(/\s+/g, '')] = index
        }
      })
    })

    // Map new column names to old field names for compatibility
    // NAME → shipper
    if (indices['name'] !== undefined) {
      indices['shipper'] = indices['name']
    } else if (indices['shippername'] !== undefined) {
      indices['shipper'] = indices['shippername']
    } else if (indices['store'] !== undefined) {
      indices['shipper'] = indices['store']
    }

    // ADDRESS → consigneeregion (for province/region extraction)
    if (indices['address'] !== undefined) {
      indices['consigneeregion'] = indices['address']
    }

    // AMOUNT → codamount
    if (indices['amount'] !== undefined) {
      indices['codamount'] = indices['amount']
    }

    // CONTACT → contactnumber (optional, not used in current data model)
    if (indices['contact'] !== undefined || indices['contactnumber'] !== undefined) {
      indices['contactnumber'] = indices['contact'] || indices['contactnumber']
    }

    return indices
  }

  const processedData = {
    all: initializeRegionData(),
    luzon: initializeRegionData(),
    visayas: initializeRegionData(),
    mindanao: initializeRegionData(),
  }

  if (sheetsData.length === 0) return processedData

  // Process each sheet separately
  for (const sheet of sheetsData) {
    const sheetData = sheet.data
    const sheetName = sheet.name

    console.log(`\n=== Processing Sheet: "${sheetName}" ===`)

    if (sheetData.length === 0) {
      console.log(`  ⚠️ Sheet is empty, skipping...`)
      continue
    }

    // Check if first row contains headers
    const firstRow = sheetData[0].map((cell: unknown) => cell?.toString() || "")
    const hasHeaders = firstRow.some((header: string) =>
      header.toUpperCase().includes("DATE") ||
      header.toUpperCase().includes("STATUS") ||
      header.toUpperCase().includes("NAME") ||
      header.toUpperCase().includes("ADDRESS") ||
      header.toUpperCase().includes("SHIPPER")
    )

    let dataRows = sheetData
    let columnIndices: { [key: string]: number } = {}

    if (hasHeaders) {
      columnIndices = findColumnIndices(firstRow)
      dataRows = sheetData.slice(1)
    } else {
      // Fallback to positional mapping for new Google Sheets structure
      // A - DATE, B - NAME, C - ADDRESS, D - CONTACT NUMBER, E - AMOUNT, F - ITEMS, G - TRACKING, H - STATUS, J - REASON
      columnIndices = {
        date: 0,            // Column A - DATE
        shipper: 1,         // Column B - NAME (customer/shipper name)
        consigneeregion: 2, // Column C - ADDRESS (for province/region extraction)
        contactnumber: 3,   // Column D - CONTACT NUMBER
        codamount: 4,       // Column E - AMOUNT
        items: 5,           // Column F - ITEMS
        tracking: 6,        // Column G - TRACKING
        status: 7,          // Column H - STATUS
        reason: 9           // Column J - REASON (if returned)
      }
    }

    // Process each row in this sheet, using sheet name as month
    let processedRowCount = 0
    let skippedRowCount = 0
    let statusCounts: { [status: string]: number } = {}
    let sampleDates: string[] = []
    let sampleStatuses: { raw: string, normalized: string }[] = []
    
    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex]
      
      // Skip completely empty rows
      if (!row || row.length === 0) {
        skippedRowCount++
        continue
      }
      
      // Skip rows where all cells are empty
      const hasData = row.some((cell: unknown) => cell !== null && cell !== undefined && cell.toString().trim() !== "")
      if (!hasData) {
        skippedRowCount++
        continue
      }

      // Use sheet name as the authoritative month for all rows in this sheet
      const month = sheetName
      
      processedRowCount++

      // Extract data with safe access - use defaults for missing columns
      const date = (columnIndices.date !== undefined && columnIndices.date < row.length) ? row[columnIndices.date]?.toString() || "" : ""
      const statusRaw = (columnIndices.status !== undefined && columnIndices.status < row.length) ? row[columnIndices.status]?.toString() || "" : ""
      const shipper = (columnIndices.shipper !== undefined && columnIndices.shipper < row.length) ? row[columnIndices.shipper]?.toString() || "" : ""
      const consigneeRegionRaw = (columnIndices.consigneeregion !== undefined && columnIndices.consigneeregion < row.length) ? row[columnIndices.consigneeregion]?.toString() || "" : ""
      const municipality = (columnIndices.municipality !== undefined && columnIndices.municipality < row.length) ? row[columnIndices.municipality]?.toString() || "" : ""
      const barangay = (columnIndices.barangay !== undefined && columnIndices.barangay < row.length) ? row[columnIndices.barangay]?.toString() || "" : ""

      // Extract financial data with safe access
      const codAmount = (columnIndices.codamount !== undefined && columnIndices.codamount < row.length) ? parseFloat(row[columnIndices.codamount]?.toString() || "0") || 0 : 0
      const serviceCharge = (columnIndices.servicecharge !== undefined && columnIndices.servicecharge < row.length) ? parseFloat(row[columnIndices.servicecharge]?.toString() || "0") || 0 : 0
      const totalCost = (columnIndices.totalcost !== undefined && columnIndices.totalcost < row.length) ? parseFloat(row[columnIndices.totalcost]?.toString() || "0") || 0 : 0
      const rtsFee = totalCost * 0.20 // 20% of total cost

      const status = normalizeStatus(statusRaw)
      
      // Track status counts per sheet
      statusCounts[status] = (statusCounts[status] || 0) + 1
      
      // Collect sample dates (first 5 rows)
      if (sampleDates.length < 5 && date) {
        sampleDates.push(date)
      }
      
      // Collect sample statuses (first 5 rows)
      if (sampleStatuses.length < 5 && statusRaw) {
        sampleStatuses.push({ raw: statusRaw, normalized: status })
      }

      // Determine region from province data (consigneeRegionRaw contains province information)
      const regionInfo = determineRegion(consigneeRegionRaw || "")

      // Assign unknown islands to Luzon as default to ensure all parcels are counted
      const island = regionInfo.island === "unknown" ? "luzon" : regionInfo.island

      // Enhanced logging for unknown locations - catch all cases where province is unknown
      if (regionInfo.province === "Unknown") {
        console.log("UNKNOWN PROVINCE PARCEL:", {
          sheetName,
          rowNumber: rowIndex + 1, // 1-based row number in sheet
          fullRowData: row,
          rawInput: consigneeRegionRaw,
          shipper,
          status,
          date,
          month,
          determinedProvince: regionInfo.province,
          determinedRegion: regionInfo.region,
          determinedIsland: island,
          codAmount,
          serviceCharge,
          totalCost
        })
      }

      const parcelData: ParcelData = {
        date,
        month,
        status,
        normalizedStatus: status,
        shipper,
        consigneeRegion: regionInfo.region,
        province: regionInfo.province,
        municipality,
        barangay,
        region: regionInfo.region,
        island,
        codAmount,
        serviceCharge,
        totalCost,
        rtsFee,
      }

      // Add to all data - count every row from any sheet
      processedData.all.data.push(parcelData)
      processedData.all.total++

      // Add to specific island if known
      if (island !== "unknown") {
        if (processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].data.push(parcelData)
          processedData[island as keyof typeof processedData].total++
        }

        // Update province and region counts
        if (regionInfo.province !== "Unknown") {
          processedData.all.provinces[regionInfo.province] = (processedData.all.provinces[regionInfo.province] || 0) + 1
          processedData.all.regions[regionInfo.region] = (processedData.all.regions[regionInfo.region] || 0) + 1

          if (processedData[island as keyof typeof processedData]) {
            processedData[island as keyof typeof processedData].provinces[regionInfo.province] =
              (processedData[island as keyof typeof processedData].provinces[regionInfo.province] || 0) + 1
            processedData[island as keyof typeof processedData].regions[regionInfo.region] = (processedData[island as keyof typeof processedData].regions[regionInfo.region] || 0) + 1
          }
        }
      }

      // Update status counts
      if (STATUSES.includes(status)) {
        processedData.all.stats[status].count++

        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].stats[status].count++
        }

        // Count by province for locations only (no fallback to region)
        if (regionInfo.province !== "Unknown") {
          processedData.all.stats[status].locations[regionInfo.province] =
            (processedData.all.stats[status].locations[regionInfo.province] || 0) + 1
          if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
            processedData[island as keyof typeof processedData].stats[status].locations[regionInfo.province] =
              (processedData[island as keyof typeof processedData].stats[status].locations[regionInfo.province] || 0) + 1
          }
        }
      }

      // Update winning and RTS shippers
      if (status === "DELIVERED") {
        processedData.all.winningShippers[shipper] = (processedData.all.winningShippers[shipper] || 0) + 1
        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].winningShippers[shipper] = (processedData[island as keyof typeof processedData].winningShippers[shipper] || 0) + 1
        }
      }

      const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
      if (rtsStatuses.includes(status)) {
        processedData.all.rtsShippers[shipper] = (processedData.all.rtsShippers[shipper] || 0) + 1
        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].rtsShippers[shipper] = (processedData[island as keyof typeof processedData].rtsShippers[shipper] || 0) + 1
        }
      }
    }
    
    // Log sheet processing summary
    console.log(`\nSheet "${sheetName}" Summary:`)
    console.log(`  - Total rows in sheet: ${dataRows.length}`)
    console.log(`  - Processed rows: ${processedRowCount}`)
    console.log(`  - Skipped rows: ${skippedRowCount}`)
    console.log(`  - Sample dates (first 5):`)
    sampleDates.forEach((date, idx) => {
      console.log(`    ${idx + 1}. "${date}"`)
    })
    console.log(`  - Sample statuses (first 5):`)
    sampleStatuses.forEach((s, idx) => {
      console.log(`    ${idx + 1}. Raw: "${s.raw}" → Normalized: "${s.normalized}"`)
    })
    console.log(`  - Status breakdown:`)
    Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      console.log(`    • ${status}: ${count}`)
    })
  }

  console.log(`\n=== FINAL PROCESSING SUMMARY ===`)
  console.log(`Total parcels processed: ${processedData.all.total}`)
  console.log(`  - Luzon: ${processedData.luzon.total}`)
  console.log(`  - Visayas: ${processedData.visayas.total}`)
  console.log(`  - Mindanao: ${processedData.mindanao.total}`)
  console.log(`\nStatus Breakdown (All Regions):`)
  Object.entries(processedData.all.stats).forEach(([status, data]) => {
    console.log(`  • ${status}: ${data.count}`)
  })

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
      fields: "sheets(properties(sheetId,title))",
    })

    return response.data.sheets?.map((sheet: sheets_v4.Schema$Sheet) => ({
      name: sheet.properties?.title || "",
      index: sheet.properties?.sheetId || 0,
    })) || []
  } catch (error) {
    console.error("Error fetching spreadsheet sheets:", error)
    throw new Error("Failed to fetch sheets")
  }
}
