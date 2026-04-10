"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { ParcelData } from "@/lib/types"
import * as XLSX from "xlsx"

interface OrdersExportButtonProps {
  orders: ParcelData[]
}

export function OrdersExportButton({ orders }: OrdersExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  if (!orders || orders.length === 0) return null

  const handleExport = async () => {
    console.log("🔵 Orders Export button clicked")

    try {
      setIsExporting(true)
      console.log("⏳ Starting orders export...")

      const workbook = XLSX.utils.book_new()

      // Prepare export data
      const exportData = orders.map(order => ({
        Date: order.date,
        Name: order.shipper,
        Address: order.fullAddress,
        Contact: order.contactNumber,
        Price: order.codAmount || 0,
        Items: order.items,
        Tracking: order.tracking,
        Status: order.status,
        Reason: order.reason || "",
        Province: order.province,
        Municipality: order.municipality,
        Region: order.region,
      }))

      // Create worksheet
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
        { wch: 20 }, // Province
        { wch: 20 }, // Municipality
        { wch: 15 }, // Region
      ]

      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")

      const filename = `orders-${new Date().toISOString().split("T")[0]}.xlsx`
      console.log("💾 Filename:", filename)

      XLSX.writeFile(workbook, filename)
      console.log("✅ Orders exported successfully")

      alert(`${orders.length} orders exported successfully!`)
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
      className="w-full sm:w-auto"
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
