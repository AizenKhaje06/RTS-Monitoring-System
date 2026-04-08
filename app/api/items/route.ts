import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export const dynamic = 'force-dynamic'

// GET - Fetch all active items
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('item_name', { ascending: true })

    if (error) {
      console.error('❌ Error fetching items:', error)
      return NextResponse.json({
        error: "Failed to fetch items",
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    console.error("❌ Error in items endpoint:", error)
    return NextResponse.json({
      error: "Failed to fetch items",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Create new item
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { item_name, description, default_price } = body

    if (!item_name) {
      return NextResponse.json({
        error: "Item name is required"
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('items')
      .insert([{
        item_name,
        description: description || '',
        default_price: default_price || 0,
        is_active: true,
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating item:', error)
      return NextResponse.json({
        error: "Failed to create item",
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    console.error("❌ Error in create item:", error)
    return NextResponse.json({
      error: "Failed to create item",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT - Update item
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, item_name, description, default_price, is_active } = body

    if (!id) {
      return NextResponse.json({
        error: "Item ID is required"
      }, { status: 400 })
    }

    const updates: Record<string, string | number | boolean> = {
      updated_at: new Date().toISOString()
    }

    if (item_name !== undefined) updates.item_name = item_name
    if (description !== undefined) updates.description = description
    if (default_price !== undefined) updates.default_price = default_price
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating item:', error)
      return NextResponse.json({
        error: "Failed to update item",
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    console.error("❌ Error in update item:", error)
    return NextResponse.json({
      error: "Failed to update item",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE - Delete item (soft delete by setting is_active to false)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        error: "Item ID is required"
      }, { status: 400 })
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting item:', error)
      return NextResponse.json({
        error: "Failed to delete item",
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error in delete item:", error)
    return NextResponse.json({
      error: "Failed to delete item",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
