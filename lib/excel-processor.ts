import * as XLSX from "xlsx"
import type { ParcelData, ProcessedData, RegionData, StatusCount } from "./types"
import { determineRegion } from "./philippine-regions"

const STATUSES = ["DELIVERED", "ONDELIVERY", "PICKUP", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED"]

export function normalizeStatus(rawStatus: string): string {
  const normalized = rawStatus.toUpperCase().trim()
  if (normalized === "DELIVERED") return "DELIVERED"
  if (normalized === "ON DELIVERY" || normalized === "ONDELIVERY") return "ONDELIVERY"
  if (normalized === "PICK UP" || normalized === "PICKUP" || normalized === "PICKED UP") return "PICKUP"
  if (normalized === "IN TRANSIT" || normalized === "INTRANSIT") return "INTRANSIT"
  if (normalized === "CANCELLED") return "CANCELLED"
  if (normalized === "DETAINED") return "DETAINED"
  if (normalized === "PROBLEMATIC" || normalized === "PROBLEMATIC PROCESSING") return "PROBLEMATIC"
  if (normalized === "RETURNED") return "RETURNED"
  return "OTHER"
}

function initializeRegionData(): RegionData {
  const stats: { [status: string]: StatusCount } = {}
  STATUSES.forEach((status) => {
    stats[status] = { count: 0, locations: {} }
  })

  return {
    data: [],
    stats,
    provinces: {},
    regions: {},
    total: 0,
    winningShippers: {},
    rtsShippers: {},
  }
}

export async function processExcelFile(file: File): Promise<ProcessedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "array" })

        // Combine data from all sheets
        let combinedData: any[][] = []
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          if (sheetData.length > 1) {
            if (combinedData.length === 0) {
              combinedData = sheetData
            } else {
              combinedData = combinedData.concat(sheetData.slice(1))
            }
          }
        })

        const processedData = processData(combinedData)
        resolve(processedData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

function processData(excelData: any[][]): ProcessedData {
  const headers = excelData[0]
  const rows = excelData.slice(1)

  const processedData: ProcessedData = {
    all: initializeRegionData(),
    luzon: initializeRegionData(),
    visayas: initializeRegionData(),
    mindanao: initializeRegionData(),
  }

  rows.forEach((row) => {
    if (row.length < 14) return

    const rawStatus = (row[2] || "").toString().toUpperCase().trim() // Column C
    const status = normalizeStatus(rawStatus)
    const shipper = row[5] || "" // Column F
    const consigneeRegion = row[13] || "" // Column N
    const date = row[0] || "" // Column A

    const codAmount = Number.parseFloat(row[17]) || 0 // Column R (index 17)
    const serviceCharge = Number.parseFloat(row[18]) || 0 // Column S (index 18)
    const totalCost = Number.parseFloat(row[19]) || 0 // Column T (index 19)
    const rtsFee = totalCost * 0.2 // RTS FEE = 20% of total cost

    if (!rawStatus || !consigneeRegion) return

    const regionInfo = determineRegion(consigneeRegion)
    const island = regionInfo.island

    const parcelData: ParcelData = {
      status: rawStatus,
      normalizedStatus: status,
      shipper,
      consigneeRegion,
      province: regionInfo.province,
      region: regionInfo.region,
      island: island,
      date: date,
      codAmount,
      serviceCharge,
      totalCost,
      rtsFee,
    }

    // Add to all regions and specific island
    if (island !== "unknown") {
      processedData.all.data.push(parcelData)
      processedData.all.total++

      if (processedData[island]) {
        processedData[island].data.push(parcelData)
        processedData[island].total++
      }

      // Update province and region counts
      if (regionInfo.province !== "Unknown") {
        processedData.all.provinces[regionInfo.province] = (processedData.all.provinces[regionInfo.province] || 0) + 1
        processedData.all.regions[regionInfo.region] = (processedData.all.regions[regionInfo.region] || 0) + 1

        if (processedData[island]) {
          processedData[island].provinces[regionInfo.province] =
            (processedData[island].provinces[regionInfo.province] || 0) + 1
          processedData[island].regions[regionInfo.region] = (processedData[island].regions[regionInfo.region] || 0) + 1
        }
      }

      // Update status counts
      if (STATUSES.includes(status)) {
        processedData.all.stats[status].count++

        if (processedData[island]) {
          processedData[island].stats[status].count++
        }

        // Count by province for locations
        const location = regionInfo.province
        if (location !== "Unknown") {
          processedData.all.stats[status].locations[location] =
            (processedData.all.stats[status].locations[location] || 0) + 1
          if (processedData[island]) {
            processedData[island].stats[status].locations[location] =
              (processedData[island].stats[status].locations[location] || 0) + 1
          }
        }
      }

      // Update winning and RTS shippers
      if (status === "DELIVERED") {
        processedData.all.winningShippers[shipper] = (processedData.all.winningShippers[shipper] || 0) + 1
        if (processedData[island]) {
          processedData[island].winningShippers[shipper] = (processedData[island].winningShippers[shipper] || 0) + 1
        }
      }

      const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
      if (rtsStatuses.includes(status)) {
        processedData.all.rtsShippers[shipper] = (processedData.all.rtsShippers[shipper] || 0) + 1
        if (processedData[island]) {
          processedData[island].rtsShippers[shipper] = (processedData[island].rtsShippers[shipper] || 0) + 1
        }
      }
    }
  })

  return processedData
}
