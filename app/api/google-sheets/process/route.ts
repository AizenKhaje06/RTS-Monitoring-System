import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { processGoogleSheetsData } from "@/lib/google-sheets-processor"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { spreadsheetId, sheetName } = await request.json()

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID required" }, { status: 400 })
    }

    const data = await processGoogleSheetsData(
      session.accessToken as string,
      spreadsheetId,
      sheetName || undefined
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing Google Sheets data:", error)
    return NextResponse.json({ error: "Failed to process data" }, { status: 500 })
  }
}
