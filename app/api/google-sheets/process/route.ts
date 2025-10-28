import { NextRequest, NextResponse } from "next/server"
import { processGoogleSheetsData } from "@/lib/google-sheets-processor"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, sheetName } = await request.json()

    // Use the provided spreadsheetId or fall back to env variable
    const targetSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEET_ID

    if (!targetSpreadsheetId) {
      return NextResponse.json({ error: "No spreadsheet ID provided" }, { status: 400 })
    }

    const data = await processGoogleSheetsData(targetSpreadsheetId, sheetName || undefined)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing Google Sheets data:", error)
    return NextResponse.json({ error: "Failed to process data" }, { status: 500 })
  }
}
