"use client"

import { useMemo, useState } from "react"
import { Package, TrendingUp, DollarSign, Target, AlertTriangle, Lightbulb } from "lucide-react"
import type { ProcessedData, FilterState, ParcelData } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    const grossSales = parcelData.reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0) // Total of all parcels
    const deliveredAmount = deliveredParcels.reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0)
    const totalServiceCharge = parcelData.reduce((sum, parcel) => sum + (parcel.serviceCharge || 0), 0)
    const totalShippingCost = parcelData.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
    const totalRTSFee = returnedParcels.reduce((sum, parcel) => sum + (parcel.rtsFee || 0), 0)
    const grossProfit = deliveredAmount - totalShippingCost - totalServiceCharge
    const netProfit = grossProfit - totalRTSFee
    const avgProfitPerShipment = totalShipments > 0 ? netProfit / totalShipments : 0

    // Rates based on total parcels
    const deliveryRate = totalShipments > 0 ? (deliveredCount / totalShipments) * 100 : 0
    const rtsRate = totalShipments > 0 ? (rtsCount / totalShipments) * 100 : 0

    // Calculate Undelivered Parcel Rate (On Delivery, Pickup, In Transit, Detained, Problematic)
    const undeliveredStatuses = ["ONDELIVERY", "PICKUP", "INTRANSIT", "DETAINED", "PROBLEMATIC", "PENDING", "CANCELLED"]
    const undeliveredParcels = parcelData.filter((parcel) => undeliveredStatuses.includes(parcel.normalizedStatus))
    const undeliveredCount = undeliveredParcels.length
    const receivableAmount = undeliveredParcels.reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0)
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
      const regionTotal = regionData.length
      const regionDeliveryRate = regionTotal > 0 ? (regionDelivered / regionTotal) * 100 : 0
      const regionRTSRate = regionTotal > 0 ? (regionRTS / regionTotal) * 100 : 0
      const regionUndeliveredRate = regionTotal > 0 ? (regionUndelivered / regionTotal) * 100 : 0

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
      
      // Count parcels by status
      const delivered = zoneParcels.filter(p => p.normalizedStatus === "DELIVERED").length
      const returned = zoneParcels.filter(p => p.normalizedStatus === "RETURNED").length
      const inTransit = zoneParcels.filter(p => p.normalizedStatus === "INTRANSIT").length
      const onDelivery = zoneParcels.filter(p => p.normalizedStatus === "ONDELIVERY").length
      const pending = zoneParcels.filter(p => p.normalizedStatus === "PENDING").length
      const cancelled = zoneParcels.filter(p => p.normalizedStatus === "CANCELLED").length
      const detained = zoneParcels.filter(p => p.normalizedStatus === "DETAINED").length
      const problematic = zoneParcels.filter(p => p.normalizedStatus === "PROBLEMATIC").length
      
      // Calculate rates based on total parcels
      const total = zoneParcels.length
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0
      const rtsRate = total > 0 ? (returned / total) * 100 : 0
      
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
      const itemGroups: Record<string, ParcelData[]> = {}
      globalFilteredData.forEach(parcel => {
        const itemName = parcel.items || "Unknown Item"
        if (!itemGroups[itemName]) {
          itemGroups[itemName] = []
        }
        itemGroups[itemName].push(parcel)
      })

      return Object.entries(itemGroups).map(([itemName, itemParcels]) => {
        const delivered = itemParcels.filter(p => p.normalizedStatus === "DELIVERED").length
        const rts = itemParcels.filter(p => p.normalizedStatus === "RETURNED").length
        const total = itemParcels.length
        const itemDeliveryRate = total > 0 ? (delivered / total) * 100 : 0
        const itemRTSRate = total > 0 ? (rts / total) * 100 : 0

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
      deliveredAmount,
      netProfit,
      avgProfitPerShipment,
      receivableAmount,
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

      {/* Tabs for Overview and Comprehensive Insights */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Comprehensive Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
            <div className="text-2xl font-bold text-green-600">{metrics?.deliveryRate.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RTS Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.rtsRate.toFixed(2)}%</div>
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
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{metrics?.deliveredAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receivable</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₱{metrics?.receivableAmount.toLocaleString()}</div>
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
                      {region.deliveryRate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-red-600">
                      {region.rtsRate.toFixed(2)}%
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
                    <TableCell className="text-green-600">{item.deliveryRate.toFixed(2)}%</TableCell>
                    <TableCell className="text-red-600">{item.rtsRate.toFixed(2)}%</TableCell>
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
                {metrics?.highestPerformingRegion?.region} leads with {metrics?.highestPerformingRegion?.profitMargin.toFixed(2)}% profit margin
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
                {metrics?.worstRTSRegion?.region} has the highest RTS rate at {metrics?.worstRTSRegion?.rtsRate.toFixed(2)}%
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
                Focus on {metrics?.worstRTSRegion?.region} to reduce RTS rate from {metrics?.worstRTSRegion?.rtsRate.toFixed(2)}%
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
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Comprehensive Insights Content */}
          <div className="glass rounded-xl p-6 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Comprehensive Business Insights</h2>
            
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-strong rounded-lg p-6 border border-green-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-bold text-foreground">Revenue Analysis</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross Sales</p>
                    <p className="text-2xl font-bold text-green-500">₱{metrics?.grossSales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered Amount</p>
                    <p className="text-xl font-bold text-foreground">₱{metrics?.deliveredAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receivable Amount</p>
                    <p className="text-xl font-bold text-blue-500">₱{metrics?.receivableAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-lg p-6 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-bold text-foreground">Performance Metrics</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Success Rate</p>
                    <p className="text-2xl font-bold text-green-500">{metrics?.deliveryRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RTS Rate</p>
                    <p className="text-xl font-bold text-red-500">{metrics?.rtsRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Shipments</p>
                    <p className="text-xl font-bold text-foreground">{metrics?.totalShipments.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-6 h-6 text-purple-500" />
                  <h3 className="text-lg font-bold text-foreground">Top Performing Item</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Item Name</p>
                    <p className="text-lg font-bold text-foreground">{metrics?.topPerformingItem?.item}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Sales</p>
                    <p className="text-xl font-bold text-green-500">₱{metrics?.topPerformingItem?.grossSales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Rate</p>
                    <p className="text-lg font-bold text-blue-500">{metrics?.topPerformingItem?.deliveryRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Performance Comparison */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Zone Performance Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics?.zonePerformance.map((zone) => (
                  <div key={zone.zone} className="glass-strong rounded-lg p-4 border border-border">
                    <h4 className="text-lg font-bold text-foreground mb-3">{zone.zone}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Delivery Rate:</span>
                        <span className="text-sm font-bold text-green-500">{zone.deliveryRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">RTS Rate:</span>
                        <span className="text-sm font-bold text-red-500">{zone.rtsRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Delivered:</span>
                        <span className="text-sm font-bold text-foreground">{zone.delivered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Returned:</span>
                        <span className="text-sm font-bold text-foreground">{zone.returned}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Strategic Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-strong rounded-lg p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h4 className="font-bold text-foreground">Focus on High-Performing Items</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Prioritize inventory and marketing for top-performing items like {metrics?.topPerformingItem?.item} to maximize revenue.
                  </p>
                </div>

                <div className="glass-strong rounded-lg p-4 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-foreground">Address RTS Issues</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Focus on {metrics?.worstRTSRegion?.region} region with {metrics?.worstRTSRegion?.rtsRate.toFixed(2)}% RTS rate to improve delivery success.
                  </p>
                </div>

                <div className="glass-strong rounded-lg p-4 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <h4 className="font-bold text-foreground">Optimize Receivables</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ₱{metrics?.receivableAmount.toLocaleString()} in receivables - focus on completing pending deliveries to improve cash flow.
                  </p>
                </div>

                <div className="glass-strong rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <h4 className="font-bold text-foreground">Leverage Best Practices</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Replicate successful strategies from {metrics?.highestPerformingRegion?.region} across other regions to boost overall performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
