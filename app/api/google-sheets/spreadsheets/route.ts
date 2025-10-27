import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getUserSpreadsheets } from "@/lib/google-sheets-processor"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const spreadsheets = await getUserSpreadsheets(session.accessToken as string)
    return NextResponse.json(spreadsheets)
  } catch (error) {
    console.error("Error fetching spreadsheets:", error)
    return NextResponse.json({ error: "Failed to fetch spreadsheets" }, { status: 500 })
  }
}
