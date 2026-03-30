"use client"

import { Download } from "lucide-react"
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
import { exportProcessedDataToCSV, exportSummaryToCSV, exportProvinceBreakdownToCSV } from "@/lib/export-utils"

interface ExportMenuProps {
  data: ProcessedData | null
  region?: "all" | "luzon" | "visayas" | "mindanao"
}

export function ExportMenu({ data, region = "all" }: ExportMenuProps) {
  if (!data) return null

  const handleExportFullData = () => {
    try {
      exportProcessedDataToCSV(data, region)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export data")
    }
  }

  const handleExportSummary = () => {
    try {
      exportSummaryToCSV(data, region)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export summary")
    }
  }

  const handleExportProvinceBreakdown = () => {
    try {
      exportProvinceBreakdownToCSV(data, region)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export province breakdown")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportFullData}>
          Full Data (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportSummary}>
          Summary Report (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportProvinceBreakdown}>
          Province Breakdown (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
