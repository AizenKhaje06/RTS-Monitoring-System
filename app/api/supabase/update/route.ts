import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { dataCache } from "@/lib/cache"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = body

    if (!id) {
      return NextResponse.json({ error: "Parcel ID is required" }, { status: 400 })
    }

    // Map frontend field names to database column names
    const dbUpdates: Record<string, string | number | boolean> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.date !== undefined) dbUpdates.parcel_date = updates.date
    if (updates.shipper !== undefined) dbUpdates.shipper_name = updates.shipper
    if (updates.fullAddress !== undefined) dbUpdates.address = updates.fullAddress
    if (updates.contactNumber !== undefined) dbUpdates.contact_number = updates.contactNumber
    if (updates.codAmount !== undefined) dbUpdates.cod_amount = updates.codAmount
    if (updates.items !== undefined) dbUpdates.items = updates.items
    if (updates.tracking !== undefined) dbUpdates.tracking_number = updates.tracking
    if (updates.normalizedStatus !== undefined) {
      dbUpdates.normalized_status = updates.normalizedStatus
      dbUpdates.status = updates.normalizedStatus // Also update raw status
    }
    if (updates.reason !== undefined) dbUpdates.reason = updates.reason

    // Update in Supabase
    const { data, error } = await supabase
      .from('parcels')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating parcel in Supabase:', error)
      return NextResponse.json({
        error: "Failed to update parcel",
        details: error.message
      }, { status: 500 })
    }

    // Clear cache to force refresh on next data fetch
    dataCache.clear()

    console.log(`✅ Updated parcel ID ${id} in Supabase`)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ Error in update endpoint:", error)
    return NextResponse.json({
      error: "Failed to update parcel",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
