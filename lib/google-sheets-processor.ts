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
          console.log(`Skipping sheet: "${sheetTitle}" (starts with 'Sheet')`)
          continue
        }

        // Only include sheets with month names and years (e.g., "MARCH 2026", "FEBRUARY 2026")
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
  console.log("=== SHEETS TO PROCESS ===")
  console.log("Total sheets:", sheetsData.length)
  sheetsData.forEach((sheet, index) => {
    console.log(`${index + 1}. "${sheet.name}" - ${sheet.data.length} rows`)
  })
  console.log("========================")
  return processGoogleSheetsDataInternal(sheetsData)
}

export function processGoogleSheetsDataInternal(sheetsData: { data: unknown[][], name: string }[]): ProcessedData {
  const STATUSES = ["DELIVERED", "ONDELIVERY", "PENDING", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED", "PENDING FULFILLED", "OTHER"]
  
  // Track what raw statuses become "OTHER" with sheet information
  const otherStatusBreakdown: { [key: string]: { count: number; sheets: { [sheetName: string]: number } } } = {}

  const normalizeStatus = (rawStatus: string, sheetName?: string): string => {
    const normalized = rawStatus.toUpperCase().trim()

    const trackOther = (status: string) => {
      if (!otherStatusBreakdown[status]) {
        otherStatusBreakdown[status] = { count: 0, sheets: {} }
      }
      otherStatusBreakdown[status].count++
      if (sheetName) {
        otherStatusBreakdown[status].sheets[sheetName] = (otherStatusBreakdown[status].sheets[sheetName] || 0) + 1
      }
    }

    // Skip/exclude these statuses - they will become "OTHER" and won't be counted
    if (normalized.includes("URGENT FULFILLED") || normalized === "CLOSED") {
      trackOther(rawStatus)
      return "OTHER"
    }

    // Use includes() for more flexible matching - order matters for specificity
    // More specific/problematic statuses first
    if (normalized.includes("PROBLEMATIC") || normalized.includes("PROBLEM")) return "PROBLEMATIC"
    if (normalized.includes("CANCELLED") || normalized.includes("CANCEL")) return "CANCELLED"
    if (normalized.includes("DETAINED") || normalized.includes("DETENTION")) return "DETAINED"
    if (normalized.includes("RETURNED") || normalized.includes("RETURN")) return "RETURNED"
    
    // Handle variations with hyphens and spaces
    if (normalized.includes("ON-DELIVERY") || normalized.includes("ON DELIVERY") || normalized.includes("ONDELIVERY") || normalized.includes("OUT FOR DELIVERY")) return "ONDELIVERY"
    if (normalized.includes("DELIVERED") || normalized.includes("DELIVER")) return "DELIVERED"
    if (normalized.includes("PICKED-UP") || normalized.includes("PICKED UP") || normalized.includes("PICK-UP") || normalized.includes("PICK UP") || normalized.includes("PICKUP") || normalized.includes("FOR PICKUP")) return "PENDING"
    if (normalized.includes("IN-TRANSIT") || normalized.includes("IN TRANSIT") || normalized.includes("INTRANSIT") || normalized.includes("TRANSIT")) return "INTRANSIT"
    
    // Separate PENDING FULFILLED from regular PENDING
    if (normalized.includes("PENDING FULFILLED")) return "PENDING FULFILLED"
    if (normalized.includes("PENDING")) return "PENDING"

    // Log unrecognized statuses
    if (rawStatus && rawStatus.trim() !== "") {
      console.log(`⚠️ Unrecognized status: "${rawStatus}" (Sheet: ${sheetName || 'unknown'}) → OTHER`)
      trackOther(rawStatus)
    } else {
      trackOther("(blank/empty)")
    }
    
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
    
    // Use exact matching first, then fallback to includes
    headers.forEach((header, index) => {
      const normalizedHeader = header?.toString().toUpperCase().trim()
      
      // Exact matches (highest priority)
      if (normalizedHeader === 'DATE') indices['date'] = index
      if (normalizedHeader === 'STATUS') indices['status'] = index
      if (normalizedHeader === 'NAME') indices['name'] = index
      if (normalizedHeader === 'ADDRESS') indices['address'] = index
      if (normalizedHeader === 'NUMBER') indices['contact'] = index
      if (normalizedHeader === 'CONTACT' || normalizedHeader === 'CONTACT NUMBER') indices['contact'] = index
      if (normalizedHeader === 'AMOUNT') indices['amount'] = index
      if (normalizedHeader === 'ITEMS') indices['items'] = index
      if (normalizedHeader === 'TRACKING') indices['tracking'] = index
      if (normalizedHeader === 'TRACKING NUMBER') indices['tracking'] = index
      if (normalizedHeader === 'REASON') indices['reason'] = index
      
      // Legacy exact matches
      if (normalizedHeader === 'STORE') indices['store'] = index
      if (normalizedHeader === 'SHIPPER' || normalizedHeader === 'SHIPPER NAME') indices['shipper'] = index
      if (normalizedHeader === 'CONSIGNEE REGION') indices['consigneeregion'] = index
      if (normalizedHeader === 'MUNICIPALITY') indices['municipality'] = index
      if (normalizedHeader === 'BARANGAY') indices['barangay'] = index
      if (normalizedHeader === 'COD AMOUNT') indices['codamount'] = index
      if (normalizedHeader === 'SERVICE CHARGE') indices['servicecharge'] = index
      if (normalizedHeader === 'TOTAL COST') indices['totalcost'] = index
    })
    
    // Fallback: partial matching only if exact match not found
    if (indices['status'] === undefined) {
      headers.forEach((header, index) => {
        const normalizedHeader = header?.toString().toUpperCase().trim()
        if (normalizedHeader?.includes('STATUS')) {
          indices['status'] = index
        }
      })
    }

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

    // NUMBER/CONTACT → contactnumber
    if (indices['contact'] !== undefined) {
      indices['contactnumber'] = indices['contact']
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

    // Log column mapping for debugging
    console.log(`\nColumn Mapping for "${sheetName}":`)
    console.log(`  - Has headers detected: ${hasHeaders}`)
    console.log(`  - Status column index: ${columnIndices.status}`)
    console.log(`  - Date column index: ${columnIndices.date}`)
    console.log(`  - Shipper column index: ${columnIndices.shipper}`)
    console.log(`  - Address column index: ${columnIndices.consigneeregion}`)
    console.log(`  - Contact number column index: ${columnIndices.contactnumber}`)
    console.log(`  - Items column index: ${columnIndices.items}`)
    console.log(`  - Tracking column index: ${columnIndices.tracking}`)
    console.log(`  - Reason column index: ${columnIndices.reason}`)
    
    // Validate STATUS column - if it's undefined or seems wrong, use fallback
    if (columnIndices.status === undefined || columnIndices.status < 0 || columnIndices.status > 20) {
      console.log(`  ⚠️ WARNING: STATUS column index seems invalid (${columnIndices.status}), using fallback index 7 (Column H)`)
      columnIndices.status = 7
    }
    
    // Show first row (header) to verify column alignment
    if (hasHeaders && sheetData.length > 0) {
      console.log(`\n  Header Row (first 12 columns):`)
      const headerRow = sheetData[0]
      for (let i = 0; i < Math.min(12, headerRow.length); i++) {
        console.log(`    Column ${String.fromCharCode(65 + i)} (index ${i}): "${headerRow[i]}"`)
      }
    }

    // Process each row in this sheet, using sheet name as month
    let processedRowCount = 0
    let skippedRowCount = 0
    const statusCounts: { [status: string]: number } = {}
    const sampleDates: string[] = []
    const sampleStatuses: { raw: string, normalized: string, columnIndex: number }[] = []
    const sampleContactNumbers: string[] = []
    const sampleItems: string[] = []
    const sampleTracking: string[] = []
    let blankStatusCount = 0
    
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
      
      // Track blank statuses
      if (!statusRaw || statusRaw.trim() === "") {
        blankStatusCount++
      }
      
      // Extract all data fields FIRST before any logging
      const shipper = (columnIndices.shipper !== undefined && columnIndices.shipper < row.length) ? row[columnIndices.shipper]?.toString() || "" : ""
      const consigneeRegionRaw = (columnIndices.consigneeregion !== undefined && columnIndices.consigneeregion < row.length) ? row[columnIndices.consigneeregion]?.toString() || "" : ""
      const contactNumber = (columnIndices.contactnumber !== undefined && columnIndices.contactnumber < row.length) ? row[columnIndices.contactnumber]?.toString() || "" : ""
      const items = (columnIndices.items !== undefined && columnIndices.items < row.length) ? row[columnIndices.items]?.toString() || "" : ""
      const tracking = (columnIndices.tracking !== undefined && columnIndices.tracking < row.length) ? row[columnIndices.tracking]?.toString() || "" : ""
      const reason = (columnIndices.reason !== undefined && columnIndices.reason < row.length) ? row[columnIndices.reason]?.toString() || "" : ""
      const municipality = (columnIndices.municipality !== undefined && columnIndices.municipality < row.length) ? row[columnIndices.municipality]?.toString() || "" : ""
      const barangay = (columnIndices.barangay !== undefined && columnIndices.barangay < row.length) ? row[columnIndices.barangay]?.toString() || "" : ""
      
      // Debug logging for first 5 rows AND first 5 blank status rows
      if (rowIndex < 5 || (blankStatusCount <= 5 && (!statusRaw || statusRaw.trim() === ""))) {
        console.log(`\n  Row ${rowIndex + 2} (data row ${rowIndex + 1}) - First 12 columns:`)
        for (let i = 0; i < Math.min(12, row.length); i++) {
          const cellValue = row[i]?.toString() || ""
          let marker = ""
          if (i === columnIndices.status) marker = " ← STATUS COLUMN"
          if (i === columnIndices.items) marker = " ← ITEMS COLUMN"
          if (i === columnIndices.tracking) marker = " ← TRACKING COLUMN"
          if (i === columnIndices.contactnumber) marker = " ← CONTACT COLUMN"
          console.log(`    Column ${String.fromCharCode(65 + i)} (index ${i}): "${cellValue}"${marker}`)
        }
        console.log(`  → Status read: "${statusRaw}" (blank: ${!statusRaw || statusRaw.trim() === ""})`)
        console.log(`  → Items read: "${items}"`)
        console.log(`  → Tracking read: "${tracking}"`)
        console.log(`  → Contact read: "${contactNumber}"`)
      }

      // Debug: Log extraction for first row
      if (rowIndex === 0) {
        console.log(`\n  🔍 FIRST ROW DATA EXTRACTION DEBUG:`)
        console.log(`    Shipper (index ${columnIndices.shipper}): "${shipper}"`)
        console.log(`    Address (index ${columnIndices.consigneeregion}): "${consigneeRegionRaw}"`)
        console.log(`    Contact (index ${columnIndices.contactnumber}): "${contactNumber}"`)
        console.log(`    Items (index ${columnIndices.items}): "${items}"`)
        console.log(`    Tracking (index ${columnIndices.tracking}): "${tracking}"`)
        console.log(`    Reason (index ${columnIndices.reason}): "${reason}"`)
      }

      // Extract financial data with safe access
      const codAmount = (columnIndices.codamount !== undefined && columnIndices.codamount < row.length) ? parseFloat(row[columnIndices.codamount]?.toString() || "0") || 0 : 0
      const serviceCharge = (columnIndices.servicecharge !== undefined && columnIndices.servicecharge < row.length) ? parseFloat(row[columnIndices.servicecharge]?.toString() || "0") || 0 : 0
      const totalCost = (columnIndices.totalcost !== undefined && columnIndices.totalcost < row.length) ? parseFloat(row[columnIndices.totalcost]?.toString() || "0") || 0 : 0
      const rtsFee = totalCost * 0.20 // 20% of total cost

      const status = normalizeStatus(statusRaw, sheetName)
      
      // Track status counts per sheet
      statusCounts[status] = (statusCounts[status] || 0) + 1
      
      // Collect sample dates (first 5 rows)
      if (sampleDates.length < 5 && date) {
        sampleDates.push(date)
      }
      
      // Collect sample statuses (first 5 rows)
      if (sampleStatuses.length < 5 && statusRaw) {
        sampleStatuses.push({ raw: statusRaw, normalized: status, columnIndex: columnIndices.status })
      }
      
      // Collect sample contact numbers (first 5 rows)
      if (sampleContactNumbers.length < 5) {
        sampleContactNumbers.push(contactNumber || '(empty)')
      }
      
      // Collect sample items (first 5 rows)
      if (sampleItems.length < 5) {
        sampleItems.push(items || '(empty)')
      }
      
      // Collect sample tracking (first 5 rows)
      if (sampleTracking.length < 5) {
        sampleTracking.push(tracking || '(empty)')
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
        fullAddress: consigneeRegionRaw || '', // Store complete address from Column C
        contactNumber: contactNumber || '', // Store contact number from Column D
        items: items || '', // Store items from Column F
        tracking: tracking || '', // Store tracking number from Column G
        reason: reason || '', // Store reason from Column I
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
      
      // Debug: Log first 3 parcel objects to verify data is in the object
      if (processedRowCount <= 3) {
        console.log(`\n  📦 ParcelData Object #${processedRowCount}:`)
        console.log(`    Shipper: "${parcelData.shipper}"`)
        console.log(`    Items: "${parcelData.items}"`)
        console.log(`    Tracking: "${parcelData.tracking}"`)
        console.log(`    Contact: "${parcelData.contactNumber}"`)
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
    console.log(`  - Blank status count: ${blankStatusCount}`)
    console.log(`  - Sample dates (first 5):`)
    sampleDates.forEach((date, idx) => {
      console.log(`    ${idx + 1}. "${date}"`)
    })
    console.log(`  - Sample statuses (first 5):`)
    sampleStatuses.forEach((s, idx) => {
      console.log(`    ${idx + 1}. Column ${String.fromCharCode(65 + s.columnIndex)} (index ${s.columnIndex}): Raw: "${s.raw}" → Normalized: "${s.normalized}"`)
    })
    console.log(`  - Sample contact numbers (first 5):`)
    sampleContactNumbers.forEach((contact, idx) => {
      console.log(`    ${idx + 1}. "${contact}"`)
    })
    console.log(`  - Sample items (first 5):`)
    sampleItems.forEach((item, idx) => {
      console.log(`    ${idx + 1}. "${item}"`)
    })
    console.log(`  - Sample tracking numbers (first 5):`)
    sampleTracking.forEach((track, idx) => {
      console.log(`    ${idx + 1}. "${track}"`)
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
  
  // Show what raw statuses became "OTHER"
  if (Object.keys(otherStatusBreakdown).length > 0) {
    console.log(`\n⚠️ OTHER Status Breakdown (Raw statuses that became "OTHER"):`)
    Object.entries(otherStatusBreakdown)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([rawStatus, data]) => {
        console.log(`  • "${rawStatus}": ${data.count} parcels`)
        Object.entries(data.sheets).forEach(([sheet, count]) => {
          console.log(`      - ${sheet}: ${count}`)
        })
      })
  }

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
