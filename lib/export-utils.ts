// Utility functions for exporting data to various formats

import type { ProcessedData } from "./types"
import * as XLSX from "xlsx"

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

export function exportToExcelByStatus(data: ProcessedData, region: "all" | "luzon" | "visayas" | "mindanao" = "all") {
  console.log("📦 exportToExcelByStatus called")
  console.log("📊 Data received:", data)
  console.log("🌍 Region:", region)
  
  const regionData = data[region]
  console.log("📍 Region data:", regionData)
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new()
  console.log("📝 Workbook created")
  
  // Get all unique provinces sorted by count (descending)
  const provinces = Object.entries(regionData.provinces)
    .sort(([, countA], [, countB]) => countB - countA)
  
  console.log("🏙️ Provinces:", provinces)
  
  // Create a sheet for each province
  provinces.forEach(([province, count]) => {
    console.log(`📄 Creating sheet for ${province} (${count})`)
    // Filter data by province
    const provinceData = regionData.data.filter(parcel => parcel.province === province)
    
    // Map to export format
    const exportData = provinceData.map(parcel => ({
      Date: parcel.date,
      Name: parcel.shipper,
      Address: parcel.fullAddress,
      Contact: parcel.contactNumber,
      Price: parcel.codAmount || 0,
      Items: parcel.items,
      Tracking: parcel.tracking,
      Status: parcel.status,
      Reason: parcel.reason || "",
      Municipality: parcel.municipality,
      Region: parcel.region,
    }))
    
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 }, // Date
      { wch: 20 }, // Name
      { wch: 40 }, // Address
      { wch: 15 }, // Contact
      { wch: 10 }, // Price
      { wch: 20 }, // Items
      { wch: 20 }, // Tracking
      { wch: 15 }, // Status
      { wch: 30 }, // Reason
      { wch: 20 }, // Municipality
      { wch: 15 }, // Region
    ]
    
    // Add worksheet to workbook with province name and count as sheet name
    // Excel sheet names have max 31 characters and can't contain special characters
    const sheetName = `${province} (${count})`.substring(0, 31).replace(/[:\\/?*\[\]]/g, "_")
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    console.log(`✅ Sheet added: ${sheetName}`)
  })
  
  // Generate filename with timestamp
  const filename = `parcels-by-province-${region}-${new Date().toISOString().split("T")[0]}.xlsx`
  console.log("💾 Filename:", filename)
  
  // Write the workbook to file
  console.log("📥 Writing file...")
  XLSX.writeFile(workbook, filename)
  console.log("✅ File written successfully")
}
