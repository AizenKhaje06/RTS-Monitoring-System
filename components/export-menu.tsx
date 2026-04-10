"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ProcessedData } from "@/lib/types"
import { exportProcessedDataToCSV, exportSummaryToCSV, exportProvinceBreakdownToCSV, exportToExcelByStatus } from "@/lib/export-utils"

interface ExportMenuProps {
  data: ProcessedData | null
  region?: "all" | "luzon" | "visayas" | "mindanao"
}

export function ExportMenu({ data, region = "all" }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)
  
  if (!data) return null

  const handleExportFullData = async () => {
    try {
      setIsExporting(true)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for UI feedback
      exportProcessedDataToCSV(data, region)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSummary = async () => {
    try {
      setIsExporting(true)
      await new Promise(resolve => setTimeout(resolve, 100))
      exportSummaryToCSV(data, region)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export summary")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportProvinceBreakdown = async () => {
    try {
      setIsExporting(true)
      await new Promise(resolve => setTimeout(resolve, 100))
      exportProvinceBreakdownToCSV(data, region)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export province breakdown")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcelByStatus = async () => {
    console.log("🔵 Export Excel by Province clicked")
    console.log("📊 Data:", data)
    console.log("🌍 Region:", region)
    try {
      setIsExporting(true)
      console.log("⏳ Starting export...")
      await new Promise(resolve => setTimeout(resolve, 100))
      exportToExcelByStatus(data, region)
      console.log("✅ Export completed")
    } catch (error) {
      console.error("❌ Export failed:", error)
      alert("Failed to export Excel by province")
    } finally {
      setIsExporting(false)
      console.log("🏁 Export finished")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportExcelByStatus} disabled={isExporting}>
          Excel by Province (Multi-Tab)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportFullData} disabled={isExporting}>
          Full Data (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportSummary} disabled={isExporting}>
          Summary Report (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportProvinceBreakdown} disabled={isExporting}>
          Province Breakdown (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
