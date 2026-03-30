// Utility functions for exporting data to various formats

import type { ProcessedData } from "./types"

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error("No data to export")
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ""
      }).join(",")
    )
  ].join("\n")

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportProcessedDataToCSV(data: ProcessedData, region: "all" | "luzon" | "visayas" | "mindanao" = "all") {
  const regionData = data[region]
  
  const exportData = regionData.data.map(parcel => ({
    Date: parcel.date,
    Month: parcel.month,
    Status: parcel.status,
    "Normalized Status": parcel.normalizedStatus,
    Shipper: parcel.shipper,
    "Consignee Region": parcel.consigneeRegion,
    Province: parcel.province,
    Municipality: parcel.municipality,
    Barangay: parcel.barangay,
    Region: parcel.region,
    Island: parcel.island,
    "COD Amount": parcel.codAmount || 0,
    "Service Charge": parcel.serviceCharge || 0,
    "Total Cost": parcel.totalCost || 0,
    "RTS Fee": parcel.rtsFee || 0,
  }))

  exportToCSV(exportData, `rts-data-${region}-${new Date().toISOString().split("T")[0]}`)
}

export function exportSummaryToCSV(data: ProcessedData, region: "all" | "luzon" | "visayas" | "mindanao" = "all") {
  const regionData = data[region]
  
  const summaryData = Object.entries(regionData.stats).map(([status, statusData]) => ({
    Status: status,
    Count: statusData.count,
    Percentage: ((statusData.count / regionData.total) * 100).toFixed(2) + "%",
  }))

  exportToCSV(summaryData, `rts-summary-${region}-${new Date().toISOString().split("T")[0]}`)
}

export function exportProvinceBreakdownToCSV(data: ProcessedData, region: "all" | "luzon" | "visayas" | "mindanao" = "all") {
  const regionData = data[region]
  
  const provinceData = Object.entries(regionData.provinces).map(([province, count]) => ({
    Province: province,
    "Total Parcels": count,
    Percentage: ((count / regionData.total) * 100).toFixed(2) + "%",
  }))

  exportToCSV(provinceData, `province-breakdown-${region}-${new Date().toISOString().split("T")[0]}`)
}
