// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on our schema
export interface SupabaseParcel {
  id: number
  parcel_date: string
  shipper_name: string
  address: string
  contact_number: string | null
  amount: number
  items: string | null
  tracking_number: string | null
  status: string
  normalized_status: string
  reason: string | null
  province: string
  municipality: string | null
  region: string
  island: string
  cod_amount: number
  service_charge: number
  total_cost: number
  rts_fee: number
  created_at: string
  updated_at: string
}
