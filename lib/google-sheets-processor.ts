import { google } from "googleapis"
import type { ProcessedData, RegionData, StatusCount, ParcelData } from "./types"
import { determineRegion as determineRegionFromLib } from "./philippine-regions"

export async function fetchGoogleSheetsData(spreadsheetId?: string, sheetName?: string): Promise<unknown[][]> {
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

    let data: unknown[][] = []

    if (sheetName) {
      // Fetch specific sheet
      const range = `${sheetName}!A:Z` // Adjust range as needed
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSpreadsheetId,
        range,
      })
      data = response.data.values || []
    } else {
      // Combine data from all sheets, excluding summary tabs
      for (const sheet of sheetsList) {
        const sheetTitle = sheet.properties?.title || ""

        // Skip sheets that start with summary headers: DATE, CUSTOMER NAME, WAYBILL NO., STATUS
        const range = `${sheetTitle}!A:Z`
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: targetSpreadsheetId,
          range,
        })

        const sheetData = response.data.values || []

        if (sheetData.length > 0) {
          const firstRow = sheetData[0] as unknown[]
          if (firstRow.length >= 4) {
            const header1 = (firstRow[0] || "").toString().toUpperCase().trim()
            const header2 = (firstRow[1] || "").toString().toUpperCase().trim()
            const header3 = (firstRow[2] || "").toString().toUpperCase().trim()
            const header4 = (firstRow[3] || "").toString().toUpperCase().trim()

            if (header1.includes("DATE") && header2.includes("CUSTOMER") && header3.includes("WAYBILL") && header4.includes("STATUS")) {
              continue // Skip this sheet
            }
          }
        }

        if (sheetData.length > 1) {
          if (data.length === 0) {
            data = sheetData
          } else {
            data = data.concat(sheetData.slice(1))
          }
        }
      }
    }

    return data
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error)
    throw new Error("Failed to fetch data from Google Sheets")
  }
}

export async function processGoogleSheetsData(spreadsheetId?: string, sheetName?: string): Promise<ProcessedData> {
  const excelData = await fetchGoogleSheetsData(spreadsheetId, sheetName)
  return processGoogleSheetsDataInternal(excelData)
}

function processGoogleSheetsDataInternal(excelData: unknown[][]): ProcessedData {
  const STATUSES = ["DELIVERED", "ONDELIVERY", "PICKUP", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED"]

  const normalizeStatus = (rawStatus: string): string => {
    const normalized = rawStatus.toUpperCase().trim()

    // Use includes() for more flexible matching - order matters for specificity
    if (normalized.includes("ON DELIVERY") || normalized.includes("ONDELIVERY") || normalized.includes("OUT FOR DELIVERY")) return "ONDELIVERY"
    if (normalized.includes("DELIVERED") || normalized.includes("DELIVER")) return "DELIVERED"
    if (normalized.includes("PICK UP") || normalized.includes("PICKUP") || normalized.includes("PICKED UP") || normalized.includes("FOR PICKUP")) return "PICKUP"
    if (normalized.includes("IN TRANSIT") || normalized.includes("INTRANSIT") || normalized.includes("TRANSIT")) return "INTRANSIT"
    if (normalized.includes("CANCELLED") || normalized.includes("CANCEL")) return "CANCELLED"
    if (normalized.includes("DETAINED") || normalized.includes("DETENTION")) return "DETAINED"
    if (normalized.includes("PROBLEMATIC") || normalized.includes("PROBLEM")) return "PROBLEMATIC"
    if (normalized.includes("RETURNED") || normalized.includes("RETURN")) return "RETURNED"

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

  const processedData = {
    all: initializeRegionData(),
    luzon: initializeRegionData(),
    visayas: initializeRegionData(),
    mindanao: initializeRegionData(),
  }

  // Skip header row if it exists
  const dataRows = excelData.length > 0 && excelData[0][0]?.toString().toUpperCase().includes("DATE") ? excelData.slice(1) : excelData

  for (const row of dataRows) {
    if (!row || row.length < 4) continue

    const [date, , , statusRaw, ...rest] = row.map(cell => cell?.toString() || "")
    const shipper = rest[0] || ""
    const province = rest[1] || ""

    const status = normalizeStatus(statusRaw)
    const regionInfo = determineRegion(province)
    const island = regionInfo.island

    const parcelData: ParcelData = {
      date,
      status,
      normalizedStatus: status,
      shipper,
      consigneeRegion: regionInfo.region,
      province: regionInfo.province,
      region: regionInfo.region,
      island,
    }

    // Add to all data
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

      // Count by province for locations
      const location = regionInfo.province
      if (location !== "Unknown") {
        processedData.all.stats[status].locations[location] =
          (processedData.all.stats[status].locations[location] || 0) + 1
        if (island !== "unknown" && processedData[island as keyof typeof processedData]) {
          processedData[island as keyof typeof processedData].stats[status].locations[location] =
            (processedData[island as keyof typeof processedData].stats[status].locations[location] || 0) + 1
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

    return response.data.files?.map((file: any) => ({
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

    return response.data.sheets?.map((sheet: any) => ({
      name: sheet.properties?.title || "",
      index: sheet.properties?.sheetId || 0,
    })) || []
  } catch (error) {
    console.error("Error fetching spreadsheet sheets:", error)
    throw new Error("Failed to fetch sheets")
  }
}
