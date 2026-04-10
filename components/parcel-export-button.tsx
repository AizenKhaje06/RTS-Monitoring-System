"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { ProcessedData } from "@/lib/types"
import * as XLSX from "xlsx"

interface ParcelExportButtonProps {
  data: ProcessedData | null
  region?: "all" | "luzon" | "visayas" | "mindanao"
}

export function ParcelExportButton({ data, region = "all" }: ParcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  if (!data) return null

  const handleExport = async () => {
    console.log("🔵 Export button clicked")
    console.log("📊 Data:", data)
    console.log("🌍 Region:", region)

    try {
      setIsExporting(true)
      console.log("⏳ Starting export...")

      const regionData = data[region]
      console.log("📍 Region data:", regionData)

      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      console.log("📝 Workbook created")

      // Get all unique statuses
      const statuses = Object.keys(regionData.stats)
      console.log("📊 Statuses:", statuses)

      // Create a sheet for each status
      statuses.forEach(status => {
        console.log(`📄 Creating sheet for status: ${status}`)

        // Get province breakdown for this status
        const statusData = regionData.stats[status]
        const provinceCount = statusData.locations

        // Convert to array and sort by count (descending)
        const exportData = Object.entries(provinceCount)
          .sort(([, countA], [, countB]) => countB - countA)
          .map(([province, count]) => ({
            Province: province,
            Count: count,
          }))

        console.log(`📊 ${status} data:`, exportData)

        // Create worksheet from data
        const worksheet = XLSX.utils.json_to_sheet(exportData)

        // Set column widths
        worksheet["!cols"] = [
          { wch: 30 }, // Province
          { wch: 15 }, // Count
        ]

        // Add worksheet to workbook
        const sheetName = status.substring(0, 31).replace(/[:\\/?*\[\]]/g, "_")
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        console.log(`✅ Sheet added: ${sheetName}`)
      })

      // Generate filename with timestamp
      const filename = `parcels-by-status-${region}-${new Date().toISOString().split("T")[0]}.xlsx`
      console.log("💾 Filename:", filename)

      // Write the workbook to file
      console.log("📥 Writing file...")
      XLSX.writeFile(workbook, filename)
      console.log("✅ File written successfully")

      alert("Excel file downloaded successfully!")
    } catch (error) {
      console.error("❌ Export failed:", error)
      alert(`Failed to export: ${error}`)
    } finally {
      setIsExporting(false)
      console.log("🏁 Export finished")
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </>
      )}
    </Button>
  )
}
