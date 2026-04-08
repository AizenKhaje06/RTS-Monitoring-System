export interface ParcelData {
  id?: number // Supabase database ID
  date: string
  month: string // Month extracted from sheet name (e.g., "JULY 2025")
  status: string
  normalizedStatus: string
  shipper: string
  consigneeRegion: string
  fullAddress: string // Complete address from Google Sheets Column C
  contactNumber: string // Contact number from Google Sheets Column D
  items: string // Items from Google Sheets Column F
  tracking: string // Tracking number from Google Sheets Column G
  reason: string // Reason from Google Sheets Column I (if status is RETURNED)
  province: string
  municipality: string
  barangay: string
  region: string
  island: string
  codAmount?: number // Column E
  serviceCharge?: number // Column S
  totalCost?: number // Column T (shipping fee paid by seller)
  rtsFee?: number // Calculated: totalCost * 0.20
}

export interface StatusCount {
  count: number
  locations: { [province: string]: number }
}

export interface RegionData {
  data: ParcelData[]
  stats: { [status: string]: StatusCount }
  provinces: { [province: string]: number }
  regions: { [region: string]: number }
  total: number
  winningShippers: { [shipper: string]: number }
  rtsShippers: { [shipper: string]: number }
}

export interface PredictiveInsight {
  type: "warning" | "opportunity" | "info"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  recommendation: string
}

export interface TrendDataPoint {
  date: string
  delivered: number
  returned: number
  cancelled: number
  problematic: number
}

export interface ProcessedData {
  all: RegionData
  luzon: RegionData
  visayas: RegionData
  mindanao: RegionData
  analytics?: {
    trends: {
      all: TrendDataPoint[]
      luzon: TrendDataPoint[]
      visayas: TrendDataPoint[]
      mindanao: TrendDataPoint[]
    }
    insights: PredictiveInsight[]
  }
}

export interface FilterState {
  type: "all" | "province" | "month" | "year"
  value: string
}
