import { google } from "googleapis"
import type { ProcessedData } from "./types"
import { processData } from "./excel-processor"

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
  return processData(excelData)
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
