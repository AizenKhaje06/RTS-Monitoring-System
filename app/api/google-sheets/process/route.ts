import { NextRequest, NextResponse } from "next/server"
import { processGoogleSheetsData } from "@/lib/google-sheets-processor"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, sheetName } = await request.json()

    const data = await processGoogleSheetsData(spreadsheetId, sheetName || undefined)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing Google Sheets data:", error)
    return NextResponse.json({ error: "Failed to process data" }, { status: 500 })
  }
}
