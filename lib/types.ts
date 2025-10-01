export interface ParcelData {
  date: string
  status: string
  normalizedStatus: string
  shipper: string
  consigneeRegion: string
  province: string
  region: string
  island: string
  codAmount?: number // Column R
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

export interface ProcessedData {
  all: RegionData
  luzon: RegionData
  visayas: RegionData
  mindanao: RegionData
}

export interface FilterState {
  type: "all" | "province" | "month" | "year"
  value: string
}
