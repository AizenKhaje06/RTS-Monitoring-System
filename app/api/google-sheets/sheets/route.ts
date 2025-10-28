import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getSpreadsheetSheets } from "@/lib/google-sheets-processor"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID required" }, { status: 400 })
    }

    const sheets = await getSpreadsheetSheets(session.accessToken as string, spreadsheetId)
    return NextResponse.json(sheets)
  } catch (error) {
    console.error("Error fetching sheets:", error)
    return NextResponse.json({ error: "Failed to fetch sheets" }, { status: 500 })
  }
}
