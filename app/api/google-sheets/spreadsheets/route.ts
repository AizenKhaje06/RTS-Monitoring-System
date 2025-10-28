import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // For service account authentication, we don't need user session
    // The spreadsheets are predefined or can be hardcoded
    // Return a static list or fetch from env
    const spreadsheets = [
      {
        id: process.env.GOOGLE_SHEET_ID || "",
        name: "Default Spreadsheet"
      }
    ].filter(s => s.id) // Filter out empty IDs

    return NextResponse.json(spreadsheets)
  } catch (error) {
    console.error("Error fetching spreadsheets:", error)
    return NextResponse.json({ error: "Failed to fetch spreadsheets" }, { status: 500 })
  }
}
