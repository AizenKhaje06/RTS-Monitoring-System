"use client"

import { useMemo, useState } from "react"
import { TrendingUp, Package, CheckCircle, XCircle, DollarSign, Calendar, Store, Globe } from "lucide-react"
import type { ProcessedData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

interface PerformanceReportProps {
  data: ProcessedData | null
}

export function PerformanceReport({ data }: PerformanceReportProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" })
  const [selectedShipper, setSelectedShipper] = useState<string>("")
  const [selectedConsigneeRegion, setSelectedConsigneeRegion] = useState<string>("")

  const {
    metrics,
    rtsByShopData,
    rtsByRegionData,
    statusDistributionData,
    topProvinces,
    topRegions,
    regionSuccessRates,
    regionRTSRates,
  } = useMemo(() => {
    if (!data)
      return {
        metrics: null,
        rtsByShopData: [],
        rtsByRegionData: [],
        statusDistributionData: [],
        topProvinces: [],
        topRegions: [],
        regionSuccessRates: [],
        regionRTSRates: [],
      }

    const sourceData = currentRegion === "all" ? data.all : data[currentRegion]
    let filteredData = sourceData.data

    // Apply filters
    if (dateRange.start && dateRange.end) {
      filteredData = filteredData.filter((parcel) => {
        if (!parcel.date) return false
        const parcelDate = new Date(parcel.date)
        if (isNaN(parcelDate.getTime())) return false
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        return parcelDate >= startDate && parcelDate <= endDate
      })
    }

    if (selectedShipper) {
      filteredData = filteredData.filter((parcel) => parcel.shipper === selectedShipper)
    }

    if (selectedConsigneeRegion) {
      filteredData = filteredData.filter((parcel) => parcel.region === selectedConsigneeRegion)
    }

    // Calculate metrics
    const totalParcels = filteredData.length
    const deliveredParcels = filteredData.filter((p) => p.normalizedStatus === "DELIVERED").length
    const rtsStatuses = ["CANCELLED", "RETURNED"]
    const rtsParcels = filteredData.filter((p) => rtsStatuses.includes(p.normalizedStatus))
    const rtsCount = rtsParcels.length

    const deliverySuccessRate = totalParcels > 0 ? (deliveredParcels / totalParcels) * 100 : 0
    const rtsRate = totalParcels > 0 ? (rtsCount / totalParcels) * 100 : 0

    const totalCostOfReturns = rtsParcels.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)

    const deliveredAvgCost =
      deliveredParcels > 0
        ? filteredData
            .filter((p) => p.normalizedStatus === "DELIVERED")
            .reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0) / deliveredParcels
        : 0
    const rtsAvgCost =
      rtsCount > 0 ? rtsParcels.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0) / rtsCount : 0



    // RTS by Shop data
    const shopData: { [key: string]: { total: number; rts: number } } = {}
    filteredData.forEach((parcel) => {
      if (!shopData[parcel.shipper]) {
        shopData[parcel.shipper] = { total: 0, rts: 0 }
      }
      shopData[parcel.shipper].total++
      if (rtsStatuses.includes(parcel.normalizedStatus)) {
        shopData[parcel.shipper].rts++
      }
    })

    const rtsByShopData = Object.entries(shopData)
      .map(([shop, counts]) => ({
        shop,
        rtsRate: counts.total > 0 ? (counts.rts / counts.total) * 100 : 0,
        rtsCount: counts.rts,
      }))
      .sort((a, b) => b.rtsRate - a.rtsRate)
      .slice(0, 10)

    // RTS by Region data
    const regionData: { [key: string]: { total: number; rts: number } } = {}
    filteredData.forEach((parcel) => {
      if (!regionData[parcel.region]) {
        regionData[parcel.region] = { total: 0, rts: 0 }
      }
      regionData[parcel.region].total++
      if (rtsStatuses.includes(parcel.normalizedStatus)) {
        regionData[parcel.region].rts++
      }
    })

    const rtsByRegionData = Object.entries(regionData)
      .map(([region, counts]) => ({
        region,
        rtsRate: counts.total > 0 ? (counts.rts / counts.total) * 100 : 0,
        rtsCount: counts.rts,
      }))
      .sort((a, b) => b.rtsRate - a.rtsRate)
      .slice(0, 10)

    // Status distribution data
    const statusData = [
      { name: "Delivered", value: deliveredParcels, color: "#22c55e" },
      { name: "RTS", value: rtsCount, color: "#ef4444" },
      { name: "Other", value: totalParcels - deliveredParcels - rtsCount, color: "#6b7280" },
    ].filter((item) => item.value > 0)

    // Top Provinces
    const provinceCounts: { [key: string]: number } = {}
    filteredData.forEach((parcel) => {
      provinceCounts[parcel.province] = (provinceCounts[parcel.province] || 0) + 1
    })
    const topProvinces = Object.entries(provinceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    // Top Regions
    const regionCounts: { [key: string]: number } = {}
    filteredData.forEach((parcel) => {
      regionCounts[parcel.region] = (regionCounts[parcel.region] || 0) + 1
    })
    const topRegions = Object.entries(regionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)



    // Region Success Rates
    const regionSuccessData: { [key: string]: { total: number; delivered: number } } = {}
    filteredData.forEach((parcel) => {
      if (!regionSuccessData[parcel.region]) {
        regionSuccessData[parcel.region] = { total: 0, delivered: 0 }
      }
      regionSuccessData[parcel.region].total++
      if (parcel.normalizedStatus === "DELIVERED") {
        regionSuccessData[parcel.region].delivered++
      }
    })

    // Calculate success rate as delivered / total parcels in the region
    const regionSuccessRates = Object.entries(regionSuccessData)
      .map(([region, counts]) => {
        const successRate = counts.total > 0 ? (counts.delivered / counts.total) * 100 : 0
        return {
          region,
          successRate: Number(successRate.toFixed(2)),
          deliveredCount: counts.delivered,
          totalCount: counts.total,
        }
      })
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10)

    // Region RTS Rates
    const regionRTSData: { [key: string]: { total: number; rts: number } } = {}
    filteredData.forEach((parcel) => {
      if (!regionRTSData[parcel.region]) {
        regionRTSData[parcel.region] = { total: 0, rts: 0 }
      }
      regionRTSData[parcel.region].total++
      if (rtsStatuses.includes(parcel.normalizedStatus)) {
        regionRTSData[parcel.region].rts++
      }
    })

    // Calculate RTS rate as RTS parcels / total parcels in the region
    const regionRTSRates = Object.entries(regionRTSData)
      .map(([region, counts]) => {
        const rtsRate = counts.total > 0 ? (counts.rts / counts.total) * 100 : 0
        return {
          region,
          rtsRate: Number(rtsRate.toFixed(2)),
          rtsCount: counts.rts,
          totalCount: counts.total,
        }
      })
      .sort((a, b) => b.rtsRate - a.rtsRate)
      .slice(0, 10)

    return {
      metrics: {
        deliverySuccessRate,
        rtsRate,
        totalCostOfReturns,
        deliveredAvgCost,
        rtsAvgCost,
      },
      rtsByShopData,
      rtsByRegionData,
      statusDistributionData: statusData,
      topProvinces,
      topRegions,
      regionSuccessRates,
      regionRTSRates,
    }
  }, [data, currentRegion, dateRange, selectedShipper, selectedConsigneeRegion])

  // Get unique values for filters
  const uniqueShippers = useMemo(() => {
    if (!data) return []
    const sourceData = currentRegion === "all" ? data.all : data[currentRegion]
    const shippers = new Set(sourceData.data.map((p) => p.shipper).filter(Boolean))
    return Array.from(shippers).sort()
  }, [data, currentRegion])

  const uniqueConsigneeRegions = useMemo(() => {
    if (!data) return []
    const sourceData = currentRegion === "all" ? data.all : data[currentRegion]
    const regions = new Set(sourceData.data.map((p) => p.region).filter(Boolean))
    return Array.from(regions).sort()
  }, [data, currentRegion])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Upload data to view performance metrics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">PERFORMANCE DASHBOARD</h1>
        <p className="text-muted-foreground">Real-time monitoring of key operational health metrics</p>
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

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-32 h-9 text-sm"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              placeholder="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-32 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedShipper}
              onChange={(e) => setSelectedShipper(e.target.value)}
              className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-md text-foreground"
            >
              <option value="">All Shippers</option>
              {uniqueShippers.map((shipper) => (
                <option key={shipper} value={shipper}>
                  {shipper}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedConsigneeRegion}
              onChange={(e) => setSelectedConsigneeRegion(e.target.value)}
              className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-md text-foreground"
            >
              <option value="">All Regions</option>
              {uniqueConsigneeRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setDateRange({ start: "", end: "" });
              setSelectedShipper("");
              setSelectedConsigneeRegion("");
            }}
            variant="outline"
            className="h-9"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-green-500/50">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-bold text-foreground">Delivery Success Rate</h3>
          </div>
          <p className="text-3xl font-bold text-green-500 mb-2">{metrics?.deliverySuccessRate.toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground">Delivered / Total parcels</p>
        </div>

        <div className="glass rounded-xl p-6 border border-red-500/50">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-bold text-foreground">RTS Rate</h3>
          </div>
          <p className="text-3xl font-bold text-red-500 mb-2">{metrics?.rtsRate.toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground">Returned / Total parcels</p>
        </div>

        <div className="glass rounded-xl p-6 border border-orange-500/50">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-bold text-foreground">Total Cost of Returns</h3>
          </div>
          <p className="text-3xl font-bold text-orange-500 mb-2">₱{metrics?.totalCostOfReturns.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Sum of RTS parcel costs</p>
        </div>

        <div className="glass rounded-xl p-6 border border-blue-500/50">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-bold text-foreground">Avg. Cost per Parcel</h3>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-green-500">Delivered: ₱{metrics?.deliveredAvgCost.toFixed(2)}</p>
            <p className="text-lg font-bold text-red-500">RTS: ₱{metrics?.rtsAvgCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Core Visualizations */}
      {/* Core Visualizations */}
      {/* Removed Status Distribution, RTS by Shop, and RTS by Region charts as requested */}

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Provinces */}
        <div className="glass rounded-xl p-6 border border-border/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Top Provinces</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {topProvinces.map(([province, count], index) => (
              <div key={province} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{province}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Regions */}
        <div className="glass rounded-xl p-6 border border-border/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Top Regions</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {topRegions.map(([region, count], index) => (
              <div key={region} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{region}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Region Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Region Success Rates */}
        <div className="glass rounded-xl p-6 border border-green-500/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Region Success Rates</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {regionSuccessRates.map((item, index) => (
              <div key={item.region} className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-green-500 w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{item.region}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-500">{item.successRate.toFixed(2)}%</span>
                  <p className="text-xs text-muted-foreground">{item.deliveredCount.toLocaleString()} delivered</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region RTS Rates */}
        <div className="glass rounded-xl p-6 border border-red-500/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Region RTS Rates</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {regionRTSRates.map((item, index) => (
              <div key={item.region} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-500 w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{item.region}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-red-500">{item.rtsRate.toFixed(2)}%</span>
                  <p className="text-xs text-muted-foreground">{item.rtsCount.toLocaleString()} RTS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
