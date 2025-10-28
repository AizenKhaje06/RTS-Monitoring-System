import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID required" }, { status: 400 })
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(sheetId,title))",
    })

    const sheetList = response.data.sheets?.map((sheet) => ({
      name: sheet.properties?.title || "",
      index: sheet.properties?.sheetId || 0,
    })) || []

    return NextResponse.json(sheetList)
  } catch (error) {
    console.error("Error fetching sheets:", error)
    return NextResponse.json({ error: "Failed to fetch sheets" }, { status: 500 })
  }
}
