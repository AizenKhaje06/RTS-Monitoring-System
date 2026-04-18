import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all users
export async function GET() {
  try {
    console.log("🔵 GET /api/users - Fetching users from Supabase...")
    
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("role", { ascending: false }) // admin first

    if (error) {
      console.error("❌ Supabase error:", error)
      throw error
    }

    console.log("✅ Fetched users:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, username, password, role } = body

    console.log("🔵 PUT /api/users - Received:", { id, username, password, role })

    if (!id || !username || !password || !role) {
      console.error("❌ Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    console.log("📤 Updating user in Supabase...")
    
    // First, check if username already exists for a different user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", id)
      .single()

    if (existingUser) {
      console.error("❌ Username already exists")
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from("users")
      .update({ username, password, role })
      .eq("id", id)
      .select()

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to update user" },
        { status: 500 }
      )
    }

    console.log("✅ Update successful:", data[0])
    return NextResponse.json(data[0])
  } catch (error: any) {
    console.error("❌ Error updating user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    )
  }
}
