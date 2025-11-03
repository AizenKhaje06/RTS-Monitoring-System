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
  filteredData: unknown[]
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
    filteredData,
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
    let filteredData = sourceData.data

    // Apply additional filter
    if (filter.type === "province") {
      filteredData = filteredData.filter((parcel) => parcel.province.toLowerCase().includes(filter.value.toLowerCase()))
    }
    // Helper function to parse date and extract month/year
    const parseDateForMonthYear = (dateStr: string): { month: number; year: number } | null => {
      // Check if it's an Excel serial date (number)
      const num = Number.parseFloat(dateStr)
      if (!isNaN(num) && num > 0) {
        // Convert Excel serial date to JavaScript date
        // Excel dates start from 1900-01-01 as 1, Unix epoch is 1970-01-01
        const jsDate = new Date((num - 25569) * 86400 * 1000)
        if (!isNaN(jsDate.getTime())) {
          return { month: jsDate.getMonth() + 1, year: jsDate.getFullYear() }
        }
      }

      // Try to parse as standard date first
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) {
        return { month: d.getMonth() + 1, year: d.getFullYear() }
      }

      // Fallback for various date formats
      const datePart = dateStr.split(" ")[0]

      // Try YYYY-MM-DD format
      const dashParts = datePart.split("-")
      if (dashParts.length >= 3) {
        const year = Number.parseInt(dashParts[0], 10)
        const month = Number.parseInt(dashParts[1], 10)
        if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
          return { month, year }
        }
      }

      // Try MM/DD/YYYY or DD/MM/YYYY format
      const slashParts = datePart.split("/")
      if (slashParts.length === 3) {
        const part1 = Number.parseInt(slashParts[0], 10)
        const part2 = Number.parseInt(slashParts[1], 10)
        const year = Number.parseInt(slashParts[2], 10)
        let month, day
        if (part1 > 12) {
          // Likely DD/MM/YYYY
          day = part1
          month = part2
        } else {
          // Assume MM/DD/YYYY
          month = part1
          day = part2
        }
        if (!isNaN(month) && !isNaN(day) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return { month, year }
        }
      }

      return null
    }

    if (filter.type === "month") {
      filteredData = filteredData.filter((parcel) => {
        if (!parcel.date) return false
        const dateStr = parcel.date.toString().trim()
        const parsed = parseDateForMonthYear(dateStr)
        return parsed ? parsed.month === Number.parseInt(filter.value, 10) : false
      })
    }
    if (filter.type === "year") {
      filteredData = filteredData.filter((parcel) => {
        if (!parcel.date) return false
        const dateStr = parcel.date.toString().trim()
        const parsed = parseDateForMonthYear(dateStr)
        return parsed ? parsed.year === Number.parseInt(filter.value, 10) : false
      })
    }

    // Calculate metrics
    const totalParcels = filteredData.length
    const deliveredParcels = filteredData.filter((p) => p.normalizedStatus === "DELIVERED").length
    const rtsStatuses = ["RETURNED"]
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

    // Calculate Undelivered Parcel Rate (On Delivery, Pickup, In Transit, Detained, Problematic)
    const undeliveredStatuses = ["ONDELIVERY", "PICKUP", "INTRANSIT", "DETAINED", "PROBLEMATIC"]
    const undeliveredCount = filteredData.filter((parcel) => undeliveredStatuses.includes(parcel.normalizedStatus)).length
    const undeliveredRate = totalParcels > 0 ? (undeliveredCount / totalParcels) * 100 : 0

    // Top Provinces
    const provinceCounts: { [key: string]: number } = {}
    filteredData.forEach((parcel) => {
      if (parcel.province && parcel.province !== "unknown location" && parcel.province !== "Unknown" && parcel.province.trim() !== "") {
        provinceCounts[parcel.province] = (provinceCounts[parcel.province] || 0) + 1
      }
    })
    const topProvinces = Object.entries(provinceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    // Top Returned Provinces
    const returnedStatuses = ["RETURNED"]
    const returnedProvinceCounts: { [key: string]: number } = {}
    filteredData.forEach((parcel) => {
      if (returnedStatuses.includes(parcel.normalizedStatus) && parcel.province && parcel.province !== "unknown location" && parcel.province !== "Unknown" && parcel.province.trim() !== "") {
        returnedProvinceCounts[parcel.province] = (returnedProvinceCounts[parcel.province] || 0) + 1
      }
    })
    const topReturnedProvinces = Object.entries(returnedProvinceCounts)
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
        undeliveredRate,
      },
      topProvinces,
      topReturnedProvinces,
      regionSuccessRates,
      regionRTSRates,
      filteredData,
    }
  }, [data, currentRegion, filter])

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
        <h1 className="text-3xl font-bold text-foreground mb-2">REGION/PROVINCE PERFORMANCE REPORT</h1>
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

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-foreground">Filter:</label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as "all" | "province" | "month" | "year")
              setFilterValue("")
            }}
            className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-md text-foreground"
          >
            <option value="all">All</option>
            <option value="province">Province</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          {filterType === "province" && (
            <Input
              type="text"
              placeholder="Enter province name"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-48 h-9 text-sm"
            />
          )}

          {filterType === "month" && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
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

          {filterType === "year" && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
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

          <Button size="sm" onClick={handleApplyFilter} className="h-9">
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={handleClearFilter} className="h-9 bg-transparent">
            Clear
          </Button>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

        <div className="glass rounded-xl p-6 border border-yellow-500/50">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-bold text-foreground">Undelivered Rate</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-500 mb-2">{metrics?.undeliveredRate.toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground">Undelivered / Total parcels</p>
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
      {/* Removed Status Distribution, RTS by Shop, and RTS by Region charts as requested */}

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Provinces */}
        <div className="glass rounded-xl p-6 border border-border/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Top Province (Delivered)</h3>
          <div className="space-y-3">
            {topProvinces.map(([province, count]: [string, number], index: number) => {
              const percentage = filteredData.length > 0 ? ((count / filteredData.length) * 100).toFixed(2) : "0.00"
              return (
                <div key={province} className="flex items-center justify-between p-3 rounded-lg bg-green-900/30">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{province}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-500">{percentage}%</span>
                    <p className="text-xs text-green-400">{count.toLocaleString()} delivered</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Returned Provinces */}
        <div className="glass rounded-xl p-6 border border-border/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Top Province (Returned)</h3>
          <div className="space-y-3">
            {topReturnedProvinces.map(([province, count]: [string, number], index: number) => {
              const percentage = filteredData.length > 0 ? ((count / filteredData.length) * 100).toFixed(2) : "0.00"
              return (
                <div key={province} className="flex items-center justify-between p-3 rounded-lg bg-red-900/30">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-red-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{province}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-500">{percentage}%</span>
                    <p className="text-xs text-red-400">{count.toLocaleString()} returned</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Shippers */}
      {/* Removed Top Delivered Shippers and Top RTS Shippers sections as requested */}

      {/* Region Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Region Success Rates */}
        <div className="glass rounded-xl p-6 border border-green-500/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Region Success Rates</h3>
          <div className="space-y-3">
            {regionSuccessRates.map((item: { region: string; successRate: number; deliveredCount: number }, index: number) => (
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
            {regionRTSRates.map((item: { region: string; rtsRate: number; rtsCount: number }, index: number) => (
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
