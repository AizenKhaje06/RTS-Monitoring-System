"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { ProcessedData } from "@/lib/types"
import * as XLSX from "xlsx"

interface PerformanceExportButtonProps {
  data: ProcessedData | null
  performanceData: {
    topProvinces: [string, number][]
    topReturnedProvinces: [string, number][]
    topRegions: [string, number][]
    topReturnedRegions: [string, number][]
    topMunicipalities: [string, number][]
    topReturnedMunicipalities: [string, number][]
    regionSuccessRates: { region: string; successRate: number; deliveredCount: number; totalCount: number }[]
    regionRTSRates: { region: string; rtsRate: number; rtsCount: number; totalCount: number }[]
    regionOnDeliveryRates: { region: string; onDeliveryRate: number; onDeliveryCount: number; totalCount: number }[]
    regionPickupRates: { region: string; pendingRate: number; pendingCount: number; totalCount: number }[]
    regionInTransitRates: { region: string; inTransitRate: number; inTransitCount: number; totalCount: number }[]
    regionCancelledRates: { region: string; cancelledRate: number; cancelledCount: number; totalCount: number }[]
    regionDetainedRates: { region: string; detainedRate: number; detainedCount: number; totalCount: number }[]
    regionProblematicRates: { region: string; problematicRate: number; problematicCount: number; totalCount: number }[]
  }
}

export function PerformanceExportButton({ data, performanceData }: PerformanceExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  if (!data) return null

  const handleExport = async () => {
    console.log("🔵 Performance Export button clicked")

    try {
      setIsExporting(true)
      console.log("⏳ Starting comprehensive performance export...")

      const workbook = XLSX.utils.book_new()

      // Single comprehensive sheet with all regions data
      const comprehensiveData = [
        // Header row
        { Metric: "DELIVERY SUCCESS RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionSuccessRates.map(item => ({
          Metric: "Delivered",
          Region: item.region,
          Count: item.deliveredCount,
          Total: item.totalCount,
          Percentage: `${item.successRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" }, // Empty row
        
        { Metric: "RTS RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionRTSRates.map(item => ({
          Metric: "Returned",
          Region: item.region,
          Count: item.rtsCount,
          Total: item.totalCount,
          Percentage: `${item.rtsRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "ON DELIVERY RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionOnDeliveryRates.map(item => ({
          Metric: "On Delivery",
          Region: item.region,
          Count: item.onDeliveryCount,
          Total: item.totalCount,
          Percentage: `${item.onDeliveryRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "PENDING RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionPickupRates.map(item => ({
          Metric: "Pending",
          Region: item.region,
          Count: item.pendingCount,
          Total: item.totalCount,
          Percentage: `${item.pendingRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "IN TRANSIT RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionInTransitRates.map(item => ({
          Metric: "In Transit",
          Region: item.region,
          Count: item.inTransitCount,
          Total: item.totalCount,
          Percentage: `${item.inTransitRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "CANCELLED RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionCancelledRates.map(item => ({
          Metric: "Cancelled",
          Region: item.region,
          Count: item.cancelledCount,
          Total: item.totalCount,
          Percentage: `${item.cancelledRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "DETAINED RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionDetainedRates.map(item => ({
          Metric: "Detained",
          Region: item.region,
          Count: item.detainedCount,
          Total: item.totalCount,
          Percentage: `${item.detainedRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "PROBLEMATIC RATES", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.regionProblematicRates.map(item => ({
          Metric: "Problematic",
          Region: item.region,
          Count: item.problematicCount,
          Total: item.totalCount,
          Percentage: `${item.problematicRate.toFixed(2)}%`,
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        // Top Provinces
        { Metric: "TOP PROVINCES - DELIVERED", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.topProvinces.map(([province, count]) => ({
          Metric: "Province",
          Region: province,
          Count: count,
          Total: "",
          Percentage: "",
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "TOP PROVINCES - RTS", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.topReturnedProvinces.map(([province, count]) => ({
          Metric: "Province",
          Region: province,
          Count: count,
          Total: "",
          Percentage: "",
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        // Top Regions
        { Metric: "TOP REGIONS - DELIVERED", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.topRegions.map(([region, count]) => ({
          Metric: "Region",
          Region: region,
          Count: count,
          Total: "",
          Percentage: "",
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "TOP REGIONS - RTS", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.topReturnedRegions.map(([region, count]) => ({
          Metric: "Region",
          Region: region,
          Count: count,
          Total: "",
          Percentage: "",
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        // Top Municipalities
        { Metric: "TOP MUNICIPALITIES - DELIVERED", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.topMunicipalities.map(([municipality, count]) => ({
          Metric: "Municipality",
          Region: municipality,
          Count: count,
          Total: "",
          Percentage: "",
        })),
        { Metric: "", Region: "", Count: "", Total: "", Percentage: "" },
        
        { Metric: "TOP MUNICIPALITIES - RTS", Region: "", Count: "", Total: "", Percentage: "" },
        ...performanceData.topReturnedMunicipalities.map(([municipality, count]) => ({
          Metric: "Municipality",
          Region: municipality,
          Count: count,
          Total: "",
          Percentage: "",
        })),
      ]

      const worksheet = XLSX.utils.json_to_sheet(comprehensiveData)
      worksheet["!cols"] = [
        { wch: 30 }, // Metric
        { wch: 25 }, // Region
        { wch: 15 }, // Count
        { wch: 15 }, // Total
        { wch: 15 }, // Percentage
      ]
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report")

      const filename = `performance-report-${new Date().toISOString().split("T")[0]}.xlsx`
      console.log("💾 Filename:", filename)

      XLSX.writeFile(workbook, filename)
      console.log("✅ Performance report exported successfully")

      alert("Performance report downloaded successfully!")
    } catch (error) {
      console.error("❌ Export failed:", error)
      alert(`Failed to export: ${error}`)
    } finally {
      setIsExporting(false)
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
          Export Report
        </>
      )}
    </Button>
  )
}
