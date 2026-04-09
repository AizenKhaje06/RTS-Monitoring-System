import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Delete the order from Supabase
    const { error } = await supabase
      .from("parcels")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Supabase delete error:", error)
      return NextResponse.json(
        { error: `Failed to delete order: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Order deleted successfully"
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Delete API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete order" },
      { status: 500 }
    )
  }
}
