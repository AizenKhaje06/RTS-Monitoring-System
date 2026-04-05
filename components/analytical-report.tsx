"use client"

import { useMemo, useState } from "react"
import { Package, TrendingUp, DollarSign, Target, AlertTriangle, Lightbulb } from "lucide-react"
import type { ProcessedData, FilterState, ParcelData } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { determineRegion } from "@/lib/philippine-regions"
import { ExportMenu } from "@/components/export-menu"

interface AnalyticalReportProps {
  data: ProcessedData | null
  filter: FilterState
  onFilterChange: (filter: FilterState) => void
}



export function AnalyticalReport({ data, filter, onFilterChange }: AnalyticalReportProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")

  const filteredData = useMemo(() => {
    if (!data) return null

    const sourceData = currentRegion === "all" ? data.all : data[currentRegion]

    if (filter.type === "all") {
      return sourceData
    }

    let filtered = sourceData.data

    if (filter.type === "province" && filter.value) {
      filtered = filtered.filter((parcel) =>
        parcel.province.toLowerCase().includes(filter.value.toLowerCase())
      )
    }

    if (filter.type === "month" && filter.value) {
      filtered = filtered.filter((parcel) => {
        if (!parcel.date) return false
        const dateStr = parcel.date.toString().trim()
        let parcelMonth = 0
        try {
          let d: Date
          const numDate = parseFloat(dateStr)
          if (!isNaN(numDate) && numDate.toString() === dateStr) {
            // Excel serial date
            d = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000)
          } else {
            d = new Date(dateStr)
          }
          if (isNaN(d.getTime())) {
            const parts = dateStr.split(" ")[0].split("-")
            if (parts.length >= 2) {
              parcelMonth = Number.parseInt(parts[1], 10)
            } else {
              // Try MM/DD/YYYY format
              const slashParts = dateStr.split("/").map(p => p.trim())
              if (slashParts.length >= 2) {
                parcelMonth = Number.parseInt(slashParts[0], 10)
              }
            }
          } else {
            parcelMonth = d.getMonth() + 1
          }
        } catch {
          const parts = dateStr.split(" ")[0].split("-")
          if (parts.length >= 2) {
            parcelMonth = Number.parseInt(parts[1], 10)
          } else {
            // Try MM/DD/YYYY
            const slashParts = dateStr.split("/").map(p => p.trim())
            if (slashParts.length >= 2) {
              parcelMonth = Number.parseInt(slashParts[0], 10)
            }
          }
        }
        return parcelMonth === Number.parseInt(filter.value, 10)
      })
    }

    if (filter.type === "year" && filter.value) {
      filtered = filtered.filter((parcel) => {
        if (!parcel.date) return false
        const dateStr = parcel.date.toString().trim()
        let parcelYear = 0
        try {
          let d: Date
          const numDate = parseFloat(dateStr)
          if (!isNaN(numDate) && numDate.toString() === dateStr) {
            // Excel serial date
            d = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000)
          } else {
            d = new Date(dateStr)
          }
          if (isNaN(d.getTime())) {
            const parts = dateStr.split(" ")[0].split("-")
            if (parts.length >= 3) {
              parcelYear = Number.parseInt(parts[0], 10)
            } else {
              // Try MM/DD/YYYY format
              const slashParts = dateStr.split("/").map(p => p.trim())
              if (slashParts.length >= 3) {
                parcelYear = Number.parseInt(slashParts[2], 10)
              }
            }
          } else {
            parcelYear = d.getFullYear()
          }
        } catch {
          const parts = dateStr.split(" ")[0].split("-")
          if (parts.length >= 3) {
            parcelYear = Number.parseInt(parts[0], 10)
          } else {
            // Try MM/DD/YYYY
            const slashParts = dateStr.split("/").map(p => p.trim())
            if (slashParts.length >= 3) {
              parcelYear = Number.parseInt(slashParts[2], 10)
            }
          }
        }
        return parcelYear === Number.parseInt(filter.value, 10)
      })
    }

    // Recalculate stats for filtered data
    const stats: { [status: string]: { count: number } } = {}
    filtered.forEach((parcel) => {
      if (!stats[parcel.normalizedStatus]) {
        stats[parcel.normalizedStatus] = { count: 0 }
      }
      stats[parcel.normalizedStatus].count++
    })

    return {
      ...sourceData,
      data: filtered,
      stats,
      total: filtered.length,
    }
  }, [data, currentRegion, filter])

  // Calculate metrics from filtered data
  const metrics = useMemo(() => {
    if (!data) return null

    // Get data filtered only by global filter (not by currentRegion for zone performance)
    let globalFilteredData = data.all.data

    // Apply global filter
    if (filter.type !== "all") {
      if (filter.type === "province" && filter.value) {
        globalFilteredData = globalFilteredData.filter((parcel) =>
          parcel.province.toLowerCase().includes(filter.value.toLowerCase())
        )
      }

      if (filter.type === "month" && filter.value) {
        globalFilteredData = globalFilteredData.filter((parcel) => {
          if (!parcel.date) return false
          const dateStr = parcel.date.toString().trim()
          let parcelMonth = 0
          try {
            let d: Date
            const numDate = parseFloat(dateStr)
            if (!isNaN(numDate) && numDate.toString() === dateStr) {
              // Excel serial date
              d = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000)
            } else {
              d = new Date(dateStr)
            }
            if (isNaN(d.getTime())) {
              const parts = dateStr.split(" ")[0].split("-")
              if (parts.length >= 2) {
                parcelMonth = Number.parseInt(parts[1], 10)
              } else {
                // Try MM/DD/YYYY format
                const slashParts = dateStr.split("/").map(p => p.trim())
                if (slashParts.length >= 2) {
                  parcelMonth = Number.parseInt(slashParts[0], 10)
                }
              }
            } else {
              parcelMonth = d.getMonth() + 1
            }
            return parcelMonth === Number.parseInt(filter.value, 10)
          } catch {
            return false
          }
        })
      }

      if (filter.type === "year" && filter.value) {
        globalFilteredData = globalFilteredData.filter((parcel) => {
          if (!parcel.date) return false
          const dateStr = parcel.date.toString().trim()
          let parcelYear = 0
          try {
            let d: Date
            const numDate = parseFloat(dateStr)
            if (!isNaN(numDate) && numDate.toString() === dateStr) {
              // Excel serial date
              d = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000)
            } else {
              d = new Date(dateStr)
            }
            if (isNaN(d.getTime())) {
              const parts = dateStr.split(" ")[0].split("-")
              if (parts.length >= 1) {
                parcelYear = Number.parseInt(parts[0], 10)
              } else {
                // Try MM/DD/YYYY format
                const slashParts = dateStr.split("/").map(p => p.trim())
                if (slashParts.length === 3) {
                  parcelYear = Number.parseInt(slashParts[2], 10)
                }
              }
            } else {
              parcelYear = d.getFullYear()
            }
            return parcelYear === Number.parseInt(filter.value, 10)
          } catch {
            return false
          }
        })
      }
    }

    const parcelData = filteredData!.data
    const rtsStatuses = ["RETURNED"]

    // Use all parcels for total shipments
    const totalShipments = parcelData.length
    const deliveredParcels = parcelData.filter(p => p.normalizedStatus === "DELIVERED")
    const returnedParcels = parcelData.filter(p => p.normalizedStatus === "RETURNED")

    // Basic counts
    const deliveredCount = deliveredParcels.length
    const rtsCount = returnedParcels.length

    // Financial calculations (only for delivered and returned parcels)
    const grossSales = deliveredParcels.reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0)
    const totalServiceCharge = parcelData.reduce((sum, parcel) => sum + (parcel.serviceCharge || 0), 0)
    const totalShippingCost = parcelData.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
    const totalRTSFee = returnedParcels.reduce((sum, parcel) => sum + (parcel.rtsFee || 0), 0)
    const grossProfit = grossSales - totalShippingCost - totalServiceCharge
    const netProfit = grossProfit - totalRTSFee
    const avgProfitPerShipment = totalShipments > 0 ? netProfit / totalShipments : 0

    // Rates based on resolved parcels (delivered + returned)
    const resolved = deliveredCount + rtsCount
    const deliveryRate = resolved > 0 ? (deliveredCount / resolved) * 100 : 0
    const rtsRate = resolved > 0 ? (rtsCount / resolved) * 100 : 0

    // Calculate Undelivered Parcel Rate (On Delivery, Pickup, In Transit, Detained, Problematic)
    const undeliveredStatuses = ["ONDELIVERY", "PICKUP", "INTRANSIT", "DETAINED", "PROBLEMATIC"]
    const undeliveredCount = parcelData.filter((parcel) => undeliveredStatuses.includes(parcel.normalizedStatus)).length
    const undeliveredRate = totalShipments > 0 ? (undeliveredCount / totalShipments) * 100 : 0

    // Regional data - filter global filtered data by island
    const regions = [
      { name: "Luzon", data: { data: globalFilteredData.filter(p => p.island === "luzon") } },
      { name: "Visayas", data: { data: globalFilteredData.filter(p => p.island === "visayas") } },
      { name: "Mindanao", data: { data: globalFilteredData.filter(p => p.island === "mindanao") } }
    ]

    const topPerformingRegions = regions.map(region => {
      const regionData = region.data.data
      const regionDelivered = regionData.filter(p => p.normalizedStatus === "DELIVERED").length
      const regionRTS = regionData.filter(p => p.normalizedStatus === "RETURNED").length
      const regionUndelivered = regionData.filter(p => undeliveredStatuses.includes(p.normalizedStatus)).length
      const regionTotalResolved = regionDelivered + regionRTS
      const regionDeliveryRate = regionTotalResolved > 0 ? (regionDelivered / regionTotalResolved) * 100 : 0
      const regionRTSRate = regionTotalResolved > 0 ? (regionRTS / regionTotalResolved) * 100 : 0
      const regionUndeliveredRate = (regionDelivered + regionRTS + regionUndelivered) > 0 ? (regionUndelivered / (regionDelivered + regionRTS + regionUndelivered)) * 100 : 0

      const regionDeliveredParcels = regionData.filter(p => p.normalizedStatus === "DELIVERED")
      const regionReturnedParcels = regionData.filter(p => p.normalizedStatus === "RETURNED")
      const regionGrossSales = regionDeliveredParcels.reduce((sum, p) => sum + (p.codAmount || 0), 0)
      const regionReturnedAmount = regionReturnedParcels.reduce((sum, p) => sum + (p.codAmount || 0), 0)
      const regionTotalServiceCharge = regionData.reduce((sum, p) => sum + (p.serviceCharge || 0), 0)
      const regionTotalShippingCost = regionData.reduce((sum, p) => sum + (p.totalCost || 0), 0)
      const regionTotalRTSFee = regionReturnedParcels.reduce((sum, p) => sum + (p.rtsFee || 0), 0)
      const regionGrossProfit = regionGrossSales - regionTotalShippingCost - regionTotalServiceCharge
      const regionNetProfit = regionGrossProfit - regionTotalRTSFee
      const regionProfitMargin = regionGrossSales > 0 ? (regionNetProfit / regionGrossSales) * 100 : 0

      return {
        region: region.name,
        deliveryRate: regionDeliveryRate,
        rtsRate: regionRTSRate,
        undeliveredRate: regionUndeliveredRate,
        deliveredCount: regionDelivered,
        rtsCount: regionRTS,
        deliveredAmount: regionGrossSales,
        returnedAmount: regionReturnedAmount,
        grossSales: regionGrossSales,
        netProfit: regionNetProfit,
        profitMargin: regionProfitMargin
      }
    }).sort((a, b) => b.netProfit - a.netProfit)

    // Zone performance (Luzon, Visayas, Mindanao) - based on global filter only
    const zonePerformance = [
      { zone: "Luzon", island: "luzon" },
      { zone: "Visayas", island: "visayas" },
      { zone: "Mindanao", island: "mindanao" }
    ].map(({ zone, island }) => {
      const zoneParcels = globalFilteredData.filter(p => p.island === island)
      const total = zoneParcels.length
      
      // Count parcels by status
      const delivered = zoneParcels.filter(p => p.normalizedStatus === "DELIVERED").length
      const returned = zoneParcels.filter(p => p.normalizedStatus === "RETURNED").length
      const inTransit = zoneParcels.filter(p => p.normalizedStatus === "INTRANSIT").length
      const onDelivery = zoneParcels.filter(p => p.normalizedStatus === "ONDELIVERY").length
      const pending = zoneParcels.filter(p => p.normalizedStatus === "PENDING").length
      const cancelled = zoneParcels.filter(p => p.normalizedStatus === "CANCELLED").length
      const detained = zoneParcels.filter(p => p.normalizedStatus === "DETAINED").length
      const problematic = zoneParcels.filter(p => p.normalizedStatus === "PROBLEMATIC").length
      
      // Calculate rates
      const resolved = delivered + returned
      const deliveryRate = resolved > 0 ? (delivered / resolved) * 100 : 0
      const rtsRate = resolved > 0 ? (returned / resolved) * 100 : 0
      
      // Calculate financials
      const grossSales = zoneParcels.filter(p => p.normalizedStatus === "DELIVERED").reduce((sum, p) => sum + (p.codAmount || 0), 0)
      const totalServiceCharge = zoneParcels.reduce((sum, p) => sum + (p.serviceCharge || 0), 0)
      const totalShippingCost = zoneParcels.reduce((sum, p) => sum + (p.totalCost || 0), 0)
      const totalRTSFee = zoneParcels.filter(p => p.normalizedStatus === "RETURNED").reduce((sum, p) => sum + (p.rtsFee || 0), 0)
      const grossProfit = grossSales - totalShippingCost - totalServiceCharge
      const netProfit = grossProfit - totalRTSFee
      const profitMargin = grossSales > 0 ? (netProfit / grossSales) * 100 : 0

      return {
        zone,
        deliveryRate,
        rtsRate,
        delivered,
        returned,
        inTransit,
        onDelivery,
        pending,
        cancelled,
        detained,
        problematic,
        grossSales,
        netProfit,
        profitMargin
      }
    })

    // Critical insights
    const highestPerformingRegion = topPerformingRegions[0]
    const worstRTSRegion = regions.reduce((worst, region) => {
      const regionData = region.data.data
      const regionRTS = regionData.filter((p: ParcelData) => rtsStatuses.includes(p.normalizedStatus)).length
      const regionTotal = regionData.length
      const regionRTSRate = regionTotal > 0 ? (regionRTS / regionTotal) * 100 : 0
      return regionRTSRate > (worst.rtsRate || 0) ? { region: region.name, rtsRate: regionRTSRate } : worst
    }, { region: "", rtsRate: 0 })
    const topPerformingZone = zonePerformance[0]

    // Items performance - based on global filter only
    const itemsPerformance = (() => {
      // Group parcels by item name
      const itemGroups: Record<string, any[]> = {}
      globalFilteredData.forEach(parcel => {
        const itemName = parcel.items || "Unknown Item"
        if (!itemGroups[itemName]) {
          itemGroups[itemName] = []
        }
        itemGroups[itemName].push(parcel)
      })

      return Object.entries(itemGroups).map(([itemName, itemParcels]) => {
        const total = itemParcels.length
        const delivered = itemParcels.filter(p => p.normalizedStatus === "DELIVERED").length
        const rts = itemParcels.filter(p => p.normalizedStatus === "RETURNED").length
        const undelivered = itemParcels.filter(p => undeliveredStatuses.includes(p.normalizedStatus)).length
        const resolved = delivered + rts
        const itemDeliveryRate = resolved > 0 ? (delivered / resolved) * 100 : 0
        const itemRTSRate = resolved > 0 ? (rts / resolved) * 100 : 0

        // Calculate financials for this item
        const itemDeliveredParcels = itemParcels.filter(p => p.normalizedStatus === "DELIVERED")
        const itemGrossSales = itemDeliveredParcels.reduce((sum, p) => sum + (p.codAmount || 0), 0)

        return {
          item: itemName,
          deliveryRate: itemDeliveryRate,
          rtsRate: itemRTSRate,
          deliveredCount: delivered,
          rtsCount: rts,
          grossSales: itemGrossSales
        }
      }).sort((a, b) => b.grossSales - a.grossSales)
    })()

    const topPerformingItem = itemsPerformance[0]

    return {
      totalShipments,
      deliveryRate,
      rtsRate,
      undeliveredRate,
      grossSales,
      netProfit,
      avgProfitPerShipment,
      topPerformingRegions,
      zonePerformance,
      itemsPerformance,
      highestPerformingRegion,
      worstRTSRegion,
      topPerformingZone,
      topPerformingItem
    }
  }, [data, filter.type, filter.value, filteredData])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <div className="glass-strong rounded-2xl p-12 text-center max-w-2xl border border-border/50">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 gradient-orange rounded-2xl opacity-20 blur-xl" />
            <div className="relative glass-strong rounded-2xl w-full h-full flex items-center justify-center border border-primary/30">
              <Package className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No Items Data</h3>
          <p className="text-muted-foreground text-lg mb-6">
            Load data from the dashboard to view items performance and corporate insights
          </p>
          <p className="text-sm text-muted-foreground">
            Navigate to the Parcel dashboard and click &ldquo;Enter Dashboard&rdquo; to load your data
          </p>
        </div>
      </div>
    )
  }

  const getColorClass = (deliveryRate: number, profitMargin: number) => {
    if (deliveryRate >= 80 && profitMargin >= 25) return "text-green-600"
    if (deliveryRate >= 70 && profitMargin >= 15) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">PRODUCT PERFORMANCE REPORT</h1>
          <p className="text-muted-foreground">Executive insights for strategic decision-making and operational excellence</p>
        </div>
        <ExportMenu data={data} region={currentRegion} />
      </div>

      {/* Region Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant={currentRegion === "all" ? "default" : "outline"}
            onClick={() => setCurrentRegion("all")}
            className="font-medium"
          >
            All Regions
          </Button>
          <Button
            variant={currentRegion === "luzon" ? "default" : "outline"}
            onClick={() => setCurrentRegion("luzon")}
            className="font-medium"
          >
            Luzon
          </Button>
          <Button
            variant={currentRegion === "visayas" ? "default" : "outline"}
            onClick={() => setCurrentRegion("visayas")}
            className="font-medium"
          >
            Visayas
          </Button>
          <Button
            variant={currentRegion === "mindanao" ? "default" : "outline"}
            onClick={() => setCurrentRegion("mindanao")}
            className="font-medium"
          >
            Mindanao
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-foreground">Filter:</label>
          <select
            value={filter.type}
            onChange={(e) => {
              onFilterChange({ type: e.target.value as "all" | "province" | "month" | "year", value: "" })
            }}
            className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-md text-foreground"
          >
            <option value="all">All</option>
            <option value="province">Province</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          {filter.type === "province" && (
            <Input
              type="text"
              placeholder="Enter province name"
              value={filter.value}
              onChange={(e) => onFilterChange({ ...filter, value: e.target.value })}
              className="w-48 h-9 text-sm"
            />
          )}

          {filter.type === "month" && (
            <select
              value={filter.value}
              onChange={(e) => onFilterChange({ ...filter, value: e.target.value })}
              className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-md text-foreground"
            >
              <option value="">Select month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {new Date(2000, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          )}

          {filter.type === "year" && (
            <select
              value={filter.value}
              onChange={(e) => onFilterChange({ ...filter, value: e.target.value })}
              className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-md text-foreground"
            >
              <option value="">Select year</option>
              {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => (
                <option key={2000 + i} value={String(2000 + i)}>
                  {2000 + i}
                </option>
              ))}
            </select>
          )}

          <Button size="sm" onClick={() => {
            if (filter.type !== "all" && !filter.value) {
              alert("Please enter or select a value to filter.")
              return
            }
            // Trigger filtering by updating state (already handled by useMemo)
          }} className="h-9">
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={() => onFilterChange({ type: "all", value: "" })} className="h-9 bg-transparent">
            Clear
          </Button>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">EXECUTIVE SUMMARY</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics?.totalShipments.toLocaleString()}</div>
            </CardContent>
          </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.deliveryRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RTS Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.rtsRate.toFixed(1)}%</div>
          </CardContent>
        </Card>



        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{metrics?.grossSales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{metrics?.netProfit.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit/Shipment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{metrics?.avgProfitPerShipment.toFixed(2)}</div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* TOP PERFORMING REGIONS */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">ZONE PERFORMANCE</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Delivery Rate (%)</TableHead>
                  <TableHead>RTS Rate (%)</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.topPerformingRegions.map((region) => (
                  <TableRow key={region.region}>
                    <TableCell className="font-medium">{region.region}</TableCell>
                    <TableCell className="text-green-600">
                      {region.deliveryRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-red-600">
                      {region.rtsRate.toFixed(1)}%
                    </TableCell>
                    <TableCell>{region.deliveredCount}</TableCell>
                    <TableCell>₱{region.deliveredAmount.toLocaleString()}</TableCell>
                    <TableCell>{region.rtsCount}</TableCell>
                    <TableCell>₱{region.returnedAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ITEMS PERFORMANCE */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">ITEMS PERFORMANCE</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Delivery Rate (%)</TableHead>
                  <TableHead>RTS Rate (%)</TableHead>
                  <TableHead>Delivered Items</TableHead>
                  <TableHead>Returned Items</TableHead>
                  <TableHead>Gross Sales (PHP)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.itemsPerformance?.slice(0, 10).map((item) => (
                  <TableRow key={item.item}>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell className="text-green-600">{item.deliveryRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-red-600">{item.rtsRate.toFixed(1)}%</TableCell>
                    <TableCell>{item.deliveredCount}</TableCell>
                    <TableCell>{item.rtsCount}</TableCell>
                    <TableCell>₱{item.grossSales.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* CRITICAL INSIGHTS */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">CRITICAL INSIGHTS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Highest Performing Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {metrics?.highestPerformingRegion?.region} leads with {metrics?.highestPerformingRegion?.profitMargin.toFixed(1)}% profit margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Worst RTS Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {metrics?.worstRTSRegion?.region} has the highest RTS rate at {metrics?.worstRTSRegion?.rtsRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Top Performing Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {metrics?.topPerformingItem?.item} leads with ₱{metrics?.topPerformingItem?.grossSales.toLocaleString()} gross sales
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">RECOMMENDATIONS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Address RTS Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Focus on {metrics?.worstRTSRegion?.region} to reduce RTS rate from {metrics?.worstRTSRegion?.rtsRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Scale Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Implement {metrics?.highestPerformingRegion?.region} strategies across other regions to improve overall performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Optimize Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Review low-margin areas and optimize cost structures to improve profitability
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
