"use client"

import { useMemo, useState } from "react"
import { TrendingUp, Package, CheckCircle, XCircle, DollarSign } from "lucide-react"
import type { ProcessedData, FilterState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PerformanceReportProps {
  data: ProcessedData | null
}

interface PerformanceData {
  metrics: {
    deliverySuccessRate: number
    rtsRate: number
    totalCostOfReturns: number
    deliveredAvgCost: number
    rtsAvgCost: number
    undeliveredRate: number
  } | null
  topProvinces: [string, number][]
  topReturnedProvinces: [string, number][]
  regionSuccessRates: { region: string; successRate: number; deliveredCount: number; totalCount: number }[]
  regionRTSRates: { region: string; rtsRate: number; rtsCount: number; totalCount: number }[]
}

export function PerformanceReport({ data }: PerformanceReportProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")
  const [filterType, setFilterType] = useState<"all" | "province" | "month" | "year">("all")
  const [filterValue, setFilterValue] = useState("")
  const [filter, setFilter] = useState<FilterState>({ type: "all", value: "" })

  const handleApplyFilter = () => {
    if (filterType !== "all" && !filterValue) {
      alert("Please enter or select a value to filter.")
      return
    }
    const newFilter: FilterState = { type: filterType, value: filterValue }
    setFilter(newFilter)
  }

  const handleClearFilter = () => {
    setFilterType("all")
    setFilterValue("")
    const newFilter: FilterState = { type: "all", value: "" }
    setFilter(newFilter)
  }

  const {
    metrics,
    topProvinces,
    topReturnedProvinces,
    regionSuccessRates,
    regionRTSRates,
  }: PerformanceData = useMemo(() => {
    if (!data)
      return {
        metrics: null,
        topProvinces: [],
        topReturnedProvinces: [],
        regionSuccessRates: [],
        regionRTSRates: [],
        filteredData: [],
      }

    const sourceData = currentRegion === "all" ? data.all : data[currentRegion]

    if (filter.type === "all") {
      // No filtering
    } else {
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
            return parcelMonth === Number.parseInt(filter.value, 10)
          } catch {
            return false
          }
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

      sourceData.data = filtered
    }

    const totalParcels = sourceData.data.length
    const deliveredParcels = sourceData.data.filter((p) => p.status === "Delivered").length
    const rtsParcels = sourceData.data.filter((p) => p.status === "RTS").length
    const undeliveredParcels = totalParcels - deliveredParcels - rtsParcels

    const deliverySuccessRate = totalParcels > 0 ? (deliveredParcels / totalParcels) * 100 : 0
    const rtsRate = totalParcels > 0 ? (rtsParcels / totalParcels) * 100 : 0
    const undeliveredRate = totalParcels > 0 ? (undeliveredParcels / totalParcels) * 100 : 0

    const totalCostOfReturns = sourceData.data
      .filter((p) => p.status === "RTS")
      .reduce((sum, p) => sum + (p.totalCost || 0), 0)

    const deliveredAvgCost =
      deliveredParcels > 0
        ? sourceData.data
            .filter((p) => p.status === "Delivered")
            .reduce((sum, p) => sum + (p.totalCost || 0), 0) / deliveredParcels
        : 0

    const rtsAvgCost =
      rtsParcels > 0
        ? sourceData.data
            .filter((p) => p.status === "RTS")
            .reduce((sum, p) => sum + (p.totalCost || 0), 0) / rtsParcels
        : 0

    // Top provinces by delivery count
    const provinceCounts = sourceData.data.reduce((acc, parcel) => {
      const province = parcel.province || "Unknown"
      acc[province] = (acc[province] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topProvinces = Object.entries(provinceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Top provinces by RTS count
    const rtsProvinceCounts = sourceData.data
      .filter((p) => p.status === "RTS")
      .reduce((acc, parcel) => {
        const province = parcel.province || "Unknown"
        acc[province] = (acc[province] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topReturnedProvinces = Object.entries(rtsProvinceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Region success rates
    const regionSuccessRates = ["luzon", "visayas", "mindanao"].map((region) => {
      const regionData = data[region as keyof ProcessedData] as typeof sourceData
      const total = regionData.data.length
      const delivered = regionData.data.filter((p) => p.status === "Delivered").length
      const successRate = total > 0 ? (delivered / total) * 100 : 0
      return { region: region.charAt(0).toUpperCase() + region.slice(1), successRate, deliveredCount: delivered, totalCount: total }
    })

    // Region RTS rates
    const regionRTSRates = ["luzon", "visayas", "mindanao"].map((region) => {
      const regionData = data[region as keyof ProcessedData] as typeof sourceData
      const total = regionData.data.length
      const rts = regionData.data.filter((p) => p.status === "RTS").length
      const rtsRate = total > 0 ? (rts / total) * 100 : 0
      return { region: region.charAt(0).toUpperCase() + region.slice(1), rtsRate, rtsCount: rts, totalCount: total }
    })

    return {
      metrics: {
        deliverySuccessRate,
        rtsRate,
        totalCostOfReturns,
        deliveredAvgCost,
        rtsAvgCost,
        undeliveredRate,
      },
      topProvinces,
      topReturnedProvinces,
      regionSuccessRates,
      regionRTSRates,
    }
  }, [data, currentRegion, filter])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Performance Report</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-1 border border-border rounded-md bg-background"
          >
            <option value="all">All</option>
            <option value="province">Province</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
        {filterType !== "all" && (
          <div className="flex items-center gap-2">
            <Input
              type={filterType === "month" || filterType === "year" ? "number" : "text"}
              placeholder={`Enter ${filterType}`}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-48"
            />
            <Button onClick={handleApplyFilter} size="sm">
              Apply
            </Button>
            <Button onClick={handleClearFilter} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-6 border border-green-500/50">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-lg font-bold text-foreground">Delivery Success Rate</h3>
              <p className="text-sm text-muted-foreground">Percentage of successful deliveries</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-500">{metrics?.deliverySuccessRate.toFixed(1)}%</p>
        </div>

        <div className="glass rounded-xl p-6 border border-red-500/50">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <h3 className="text-lg font-bold text-foreground">RTS Rate</h3>
              <p className="text-sm text-muted-foreground">Return to sender percentage</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-500">{metrics?.rtsRate.toFixed(1)}%</p>
        </div>

        <div className="glass rounded-xl p-6 border border-blue-500/50">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-bold text-foreground">Total Cost of Returns</h3>
              <p className="text-sm text-muted-foreground">Total cost for RTS parcels</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-500">₱{metrics?.totalCostOfReturns.toLocaleString()}</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-6 border border-purple-500/50">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="text-lg font-bold text-foreground">Delivered Avg Cost</h3>
              <p className="text-sm text-muted-foreground">Average cost per delivered parcel</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-500">₱{metrics?.deliveredAvgCost.toFixed(2)}</p>
        </div>

        <div className="glass rounded-xl p-6 border border-orange-500/50">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <div>
              <h3 className="text-lg font-bold text-foreground">RTS Avg Cost</h3>
              <p className="text-sm text-muted-foreground">Average cost per RTS parcel</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-500">₱{metrics?.rtsAvgCost.toFixed(2)}</p>
        </div>

        <div className="glass rounded-xl p-6 border border-gray-500/50">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-8 h-8 text-gray-500" />
            <div>
              <h3 className="text-lg font-bold text-foreground">Undelivered Rate</h3>
              <p className="text-sm text-muted-foreground">Percentage of undelivered parcels</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-500">{metrics?.undeliveredRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Top Provinces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-blue-500/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Top Provinces by Delivery Count</h3>
          <div className="space-y-3">
            {topProvinces.map(([province, count], index) => (
              <div key={province} className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-blue-500 w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{province}</span>
                </div>
                <span className="text-sm font-bold text-blue-500">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-red-500/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Top Provinces by RTS Count</h3>
          <div className="space-y-3">
            {topReturnedProvinces.map(([province, count], index) => (
              <div key={province} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-500 w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{province}</span>
                </div>
                <span className="text-sm font-bold text-red-500">{count.toLocaleString()}</span>
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
          <div className="space-y-3">
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
          <div className="space-y-3">
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
