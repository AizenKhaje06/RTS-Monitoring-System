"use client"

import { useMemo, useState } from "react"
import { PieChart, MapPin, PackageX, TrendingUp, BarChart3, DollarSign, Clock, AlertTriangle } from "lucide-react"
import type { ProcessedData, FilterState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AnalyticalReportProps {
  data: ProcessedData | null
}

export function AnalyticalReport({ data }: AnalyticalReportProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")
  const [filter, setFilter] = useState<FilterState>({ type: "all", value: "" })

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
        const parcelDate = new Date(parcel.date)
        const parcelMonth = String(parcelDate.getMonth() + 1).padStart(2, "0")
        return parcelMonth === filter.value
      })
    }

    if (filter.type === "year" && filter.value) {
      filtered = filtered.filter((parcel) => {
        if (!parcel.date) return false
        const parcelDate = new Date(parcel.date)
        return String(parcelDate.getFullYear()) === filter.value
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
    if (!filteredData) return null

    const parcelData = filteredData.data

    // Financial metrics
    const totalCOD = parcelData.reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0)
    const totalShippingCost = parcelData.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
    const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
    const rtsParcels = parcelData.filter((p) => rtsStatuses.includes(p.normalizedStatus))
    const rtsShippingCost = rtsParcels.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
    const rtsFeeLost = rtsParcels.reduce((sum, parcel) => sum + (parcel.rtsFee || 0), 0)
    const totalCostOfFailure = rtsShippingCost + rtsFeeLost

    // Address complexity score (simplified calculation)
    const avgAddressComplexity = parcelData.length > 0
      ? parcelData.reduce((sum, parcel) => {
          // Simple complexity based on address length and special characters
          const complexity = (parcel.consigneeRegion?.length || 0) +
                           (parcel.province?.length || 0) +
                           (parcel.consigneeRegion?.match(/[^a-zA-Z0-9\s]/g)?.length || 0) * 2
          return sum + complexity
        }, 0) / parcelData.length
      : 0

    return {
      totalParcels: parcelData.length,
      totalCOD,
      totalShippingCost,
      rtsParcelsCount: rtsParcels.length,
      rtsShippingCost,
      rtsFeeLost,
      totalCostOfFailure,
      avgAddressComplexity: Math.round(avgAddressComplexity * 10) / 10,
      deliveryRate: parcelData.length > 0
        ? ((parcelData.filter(p => p.normalizedStatus === "DELIVERED").length / parcelData.length) * 100)
        : 0,
      rtsRate: parcelData.length > 0 ? (rtsParcels.length / parcelData.length) * 100 : 0
    }
  }, [filteredData])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Upload data to view analytical insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">ANALYTICAL REPORT</h1>
        <p className="text-muted-foreground">Advanced analytics for operational excellence and strategic decision-making</p>
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
              setFilter({ type: e.target.value as any, value: "" })
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
              onChange={(e) => setFilter({ ...filter, value: e.target.value })}
              className="w-48 h-9 text-sm"
            />
          )}

          {filter.type === "month" && (
            <select
              value={filter.value}
              onChange={(e) => setFilter({ ...filter, value: e.target.value })}
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
              onChange={(e) => setFilter({ ...filter, value: e.target.value })}
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
          <Button size="sm" variant="outline" onClick={() => setFilter({ type: "all", value: "" })} className="h-9 bg-transparent">
            Clear
          </Button>
        </div>
      </div>

      {/* Geographic Intelligence Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">Geographic Intelligence</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-foreground">RTS Hotspot Map</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">Interactive map visualization</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Geographic distribution of RTS incidents</p>
          </div>

          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-foreground">Delivery Efficiency by Region</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">Regional performance chart</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Success rates across Philippine regions</p>
          </div>

          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-bold text-foreground">Cost-to-Serve Bubble Chart</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">Cost analysis visualization</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Operational costs vs delivery volume</p>
          </div>
        </div>
      </div>

      {/* Client & Product Analysis Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">Client & Product Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-bold text-foreground">Client Performance Matrix</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">Client performance metrics</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Delivery success rates by client</p>
          </div>

          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <PackageX className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-bold text-foreground">Product-wise RTS Rate</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">Product RTS analysis</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">RTS rates by product category</p>
          </div>
        </div>
      </div>

      {/* Temporal & Trend Analysis Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">Temporal & Trend Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
              <h3 className="text-lg font-bold text-foreground">RTS Trend Line Chart with Forecast</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">Trend analysis with forecasting</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Historical RTS trends and predictions</p>
          </div>

          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-cyan-500" />
              <h3 className="text-lg font-bold text-foreground">Pick-up Time Heatmap</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">Time-based heatmap</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Peak pickup times and patterns</p>
          </div>
        </div>
      </div>

      {/* Data & Address Quality Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">Data & Address Quality</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-bold text-foreground">Address Complexity Score KPI</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-yellow-500 mb-2">--</p>
              <p className="text-sm text-muted-foreground">Average complexity score</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Address accuracy and delivery difficulty</p>
          </div>

          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-pink-500" />
              <h3 className="text-lg font-bold text-foreground">Inferred RTS Reason Treemap</h3>
            </div>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
              <p className="text-muted-foreground text-sm">RTS reason breakdown</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Root cause analysis of RTS incidents</p>
          </div>
        </div>
      </div>

      {/* Financial Impact Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">Financial Impact</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border border-red-500/50">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-foreground">Total Cost of Failure KPI</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-red-500 mb-2">
                ₱{metrics?.totalCostOfFailure.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </p>
              <p className="text-sm text-muted-foreground">Total operational losses</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Combined cost of RTS and failed deliveries</p>
          </div>

          <div className="glass rounded-xl p-6 border border-orange-500/50">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-bold text-foreground">Uncollected COD Amount KPI</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-orange-500 mb-2">
                ₱{metrics?.totalCOD.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </p>
              <p className="text-sm text-muted-foreground">Outstanding COD value</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Value of undelivered cash-on-delivery parcels</p>
          </div>
        </div>
      </div>
    </div>
  )
}
