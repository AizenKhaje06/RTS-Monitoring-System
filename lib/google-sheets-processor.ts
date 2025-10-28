import { google } from "googleapis"
import type { ProcessedData } from "./types"

export async function fetchGoogleSheetsData(accessToken: string, spreadsheetId: string, sheetName?: string): Promise<unknown[][]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const sheets = google.sheets({ version: "v4", auth })

  try {
    // Get spreadsheet metadata to find all sheets
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const sheetsList = spreadsheetResponse.data.sheets || []

    let data: unknown[][] = []

    if (sheetName) {
      // Fetch specific sheet
      const range = `${sheetName}!A:Z` // Adjust range as needed
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
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
          spreadsheetId,
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

export async function processGoogleSheetsData(accessToken: string, spreadsheetId: string, sheetName?: string): Promise<ProcessedData> {
  const excelData = await fetchGoogleSheetsData(accessToken, spreadsheetId, sheetName)
  return processGoogleSheetsDataInternal(excelData)
}

function processGoogleSheetsDataInternal(excelData: unknown[][]): ProcessedData {
  const STATUSES = ["DELIVERED", "ONDELIVERY", "PICKUP", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED"]

  const normalizeStatus = (rawStatus: string): string => {
    const normalized = rawStatus.toUpperCase().trim()
    if (normalized === "DELIVERED") return "DELIVERED"
    if (normalized === "ON DELIVERY" || normalized === "ONDELIVERY") return "ONDELIVERY"
    if (normalized === "PICK UP" || normalized === "PICKUP" || normalized === "PICKED UP") return "PICKUP"
    if (normalized === "IN TRANSIT" || normalized === "INTRANSIT") return "INTRANSIT"
    if (normalized === "CANCELLED") return "CANCELLED"
    if (normalized === "DETAINED") return "DETAINED"
    if (normalized === "PROBLEMATIC" || normalized === "PROBLEMATIC PROCESSING") return "PROBLEMATIC"
    if (normalized === "RETURNED") return "RETURNED"
    return "OTHER"
  }

  const initializeRegionData = (): any => {
    const stats: { [status: string]: any } = {}
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
    // Simplified region determination - you may need to expand this
    const regionMap: { [key: string]: { region: string; island: string } } = {
      "METRO MANILA": { region: "NCR", island: "Luzon" },
      "CEBU": { region: "VII", island: "Visayas" },
      "DAVAO": { region: "XI", island: "Mindanao" },
      // Add more mappings as needed
    }

    const upperProvince = province.toUpperCase()
    const mapping = regionMap[upperProvince] || { region: "Unknown", island: "unknown" }

    return {
      province: province || "Unknown",
      region: mapping.region,
      island: mapping.island,
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

    const [date, customer, waybill, statusRaw, ...rest] = row.map(cell => cell?.toString() || "")
    const shipper = rest[0] || ""
    const province = rest[1] || ""

    const status = normalizeStatus(statusRaw)
    const regionInfo = determineRegion(province)
    const island = regionInfo.island

    const parcelData = {
      date,
      customer,
      waybill,
      status,
      shipper,
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

    return response.data.files?.map((file) => ({
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

    return response.data.sheets?.map((sheet) => ({
      name: sheet.properties?.title || "",
      index: sheet.properties?.sheetId || 0,
    })) || []
  } catch (error) {
    console.error("Error fetching spreadsheet sheets:", error)
    throw new Error("Failed to fetch sheets")
  }
}
