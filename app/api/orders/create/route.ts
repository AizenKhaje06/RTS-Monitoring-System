import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { dataCache } from "@/lib/cache"

export const dynamic = 'force-dynamic'

interface CreateOrderRequest {
  parcel_date: string
  shipper_name: string
  address: string
  contact_number: string
  cod_amount: number
  items: string
  tracking_number: string
  status: string
  normalized_status: string
  reason?: string
}

// Helper function to determine region and island from province
function getRegionAndIsland(province: string): { region: string; island: string } {
  const provinceLower = province.toLowerCase()
  
  // NCR
  if (provinceLower.includes('metro manila') || provinceLower.includes('manila') || 
      provinceLower.includes('quezon city') || provinceLower.includes('makati') ||
      provinceLower.includes('pasig') || provinceLower.includes('taguig') ||
      provinceLower.includes('mandaluyong') || provinceLower.includes('caloocan')) {
    return { region: 'NCR', island: 'luzon' }
  }
  
  // Region I - Ilocos Region
  const region1 = ['ilocos norte', 'ilocos sur', 'la union', 'pangasinan']
  for (const prov of region1) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region I', island: 'luzon' }
    }
  }
  
  // Region II - Cagayan Valley
  const region2 = ['batanes', 'cagayan', 'isabela', 'nueva vizcaya', 'quirino']
  for (const prov of region2) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region II', island: 'luzon' }
    }
  }
  
  // Region III - Central Luzon
  const region3 = ['bataan', 'bulacan', 'nueva ecija', 'pampanga', 'tarlac', 'zambales', 'aurora']
  for (const prov of region3) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region III', island: 'luzon' }
    }
  }
  
  // Region IV-A - CALABARZON
  const region4a = ['batangas', 'cavite', 'laguna', 'quezon', 'rizal']
  for (const prov of region4a) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region IV-A', island: 'luzon' }
    }
  }
  
  // Region IV-B - MIMAROPA
  const region4b = ['marinduque', 'occidental mindoro', 'oriental mindoro', 'palawan', 'romblon']
  for (const prov of region4b) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region IV-B', island: 'luzon' }
    }
  }
  
  // Region V - Bicol Region
  const region5 = ['albay', 'camarines norte', 'camarines sur', 'catanduanes', 'masbate', 'sorsogon']
  for (const prov of region5) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region V', island: 'luzon' }
    }
  }
  
  // CAR - Cordillera Administrative Region
  const car = ['abra', 'apayao', 'benguet', 'ifugao', 'kalinga', 'mountain province']
  for (const prov of car) {
    if (provinceLower.includes(prov)) {
      return { region: 'CAR', island: 'luzon' }
    }
  }
  
  // Region VI - Western Visayas
  const region6 = ['aklan', 'antique', 'capiz', 'guimaras', 'iloilo', 'negros occidental']
  for (const prov of region6) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region VI', island: 'visayas' }
    }
  }
  
  // Region VII - Central Visayas
  const region7 = ['bohol', 'cebu', 'negros oriental', 'siquijor']
  for (const prov of region7) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region VII', island: 'visayas' }
    }
  }
  
  // Region VIII - Eastern Visayas
  const region8 = ['biliran', 'eastern samar', 'leyte', 'northern samar', 'samar', 'southern leyte']
  for (const prov of region8) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region VIII', island: 'visayas' }
    }
  }
  
  // Region IX - Zamboanga Peninsula
  const region9 = ['zamboanga del norte', 'zamboanga del sur', 'zamboanga sibugay']
  for (const prov of region9) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region IX', island: 'mindanao' }
    }
  }
  
  // Region X - Northern Mindanao
  const region10 = ['bukidnon', 'camiguin', 'lanao del norte', 'misamis occidental', 'misamis oriental']
  for (const prov of region10) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region X', island: 'mindanao' }
    }
  }
  
  // Region XI - Davao Region
  const region11 = ['davao de oro', 'davao del norte', 'davao del sur', 'davao occidental', 'davao oriental']
  for (const prov of region11) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region XI', island: 'mindanao' }
    }
  }
  
  // Region XII - SOCCSKSARGEN
  const region12 = ['cotabato', 'sarangani', 'south cotabato', 'sultan kudarat']
  for (const prov of region12) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region XII', island: 'mindanao' }
    }
  }
  
  // Region XIII - Caraga
  const region13 = ['agusan del norte', 'agusan del sur', 'dinagat islands', 'surigao del norte', 'surigao del sur']
  for (const prov of region13) {
    if (provinceLower.includes(prov)) {
      return { region: 'Region XIII', island: 'mindanao' }
    }
  }
  
  // BARMM - Bangsamoro Autonomous Region in Muslim Mindanao
  const barmm = ['basilan', 'lanao del sur', 'maguindanao', 'sulu', 'tawi-tawi']
  for (const prov of barmm) {
    if (provinceLower.includes(prov)) {
      return { region: 'BARMM', island: 'mindanao' }
    }
  }
  
  // Default to Unknown
  return { region: 'Unknown', island: 'unknown' }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()

    // Validate required fields
    if (!body.shipper_name || !body.address || !body.contact_number || !body.items) {
      return NextResponse.json({
        error: "Missing required fields",
        details: "Shipper name, address, contact number, and items are required"
      }, { status: 400 })
    }

    // Extract municipality and province from address
    // Format: "123, Montalban, Rizal" → municipality="Montalban", province="Rizal"
    let municipality = ''
    let province = 'Unknown'
    
    if (body.address && body.address.includes(',')) {
      const parts = body.address.split(',').map(p => p.trim()).filter(p => p.length > 0)
      
      if (parts.length >= 2) {
        // Last part is province
        province = parts[parts.length - 1]
        
        // Second to last is municipality
        if (parts.length >= 2) {
          municipality = parts[parts.length - 2]
        }
      }
    }

    // Auto-detect region and island from province
    const { region, island } = getRegionAndIsland(province)

    // Calculate RTS fee (20% of total cost) - default to 0 since we removed the field
    const rtsFee = 0

    // Prepare data for insertion
    const orderData = {
      parcel_date: body.parcel_date || new Date().toISOString().split('T')[0],
      shipper_name: body.shipper_name,
      address: body.address,
      contact_number: body.contact_number,
      amount: body.cod_amount || 0,
      cod_amount: body.cod_amount || 0,
      items: body.items,
      tracking_number: body.tracking_number || `TRK-${Date.now()}`,
      status: body.status || 'PENDING',
      normalized_status: body.normalized_status || 'PENDING',
      reason: body.reason || '',
      province: province, // Auto-extracted from address
      municipality: municipality, // Auto-extracted from address
      region: region, // Auto-detected from province
      island: island, // Auto-detected from province
      service_charge: 0, // Default to 0
      total_cost: 0, // Default to 0
      rts_fee: rtsFee,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('parcels')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating order in Supabase:', error)
      return NextResponse.json({
        error: "Failed to create order",
        details: error.message
      }, { status: 500 })
    }

    // Clear cache to force refresh
    dataCache.clear()

    console.log(`✅ Created new order with ID ${data.id}`)
    return NextResponse.json({ success: true, order: data })
  } catch (error) {
    console.error("❌ Error in create order endpoint:", error)
    return NextResponse.json({
      error: "Failed to create order",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
