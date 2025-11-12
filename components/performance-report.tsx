"use client"

import { useMemo, useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import type { ProcessedData, FilterState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PerformanceReportProps {
  data: ProcessedData | null
  filter: FilterState
  onFilterChange: (filter: FilterState) => void
}

interface PerformanceData {
  topProvinces: [string, number][]
  topReturnedProvinces: [string, number][]
  topRegions: [string, number][]
  topReturnedRegions: [string, number][]
  regionSuccessRates: { region: string; successRate: number; deliveredCount: number; totalCount: number }[]
  regionRTSRates: { region: string; rtsRate: number; rtsCount: number; totalCount: number }[]
}

export function PerformanceReport({ data, filter, onFilterChange }: PerformanceReportProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")
  const [filterType, setFilterType] = useState<"all" | "province" | "month" | "year">("all")
  const [filterValue, setFilterValue] = useState("")

  const handleApplyFilter = () => {
    if (filterType !== "all" && !filterValue) {
      alert("Please enter or select a value to filter.")
      return
    }
    const newFilter: FilterState = { type: filterType, value: filterValue }
    onFilterChange(newFilter)
  }

  const handleClearFilter = () => {
    setFilterType("all")
    setFilterValue("")
    const newFilter: FilterState = { type: "all", value: "" }
    onFilterChange(newFilter)
  }

  const {
    topProvinces,
    topReturnedProvinces,
    topRegions,
    topReturnedRegions,
    regionSuccessRates,
    regionRTSRates,
  }: PerformanceData = useMemo(() => {
    if (!data)
      return {
        topProvinces: [],
        topReturnedProvinces: [],
        topRegions: [],
        topReturnedRegions: [],
        regionSuccessRates: [],
        regionRTSRates: [],
      }

    const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]

    // Start with all data
    let filteredData = data.all.data

    // Apply global filter
    if (filter.type !== "all") {
      if (filter.type === "province" && filter.value) {
        filteredData = filteredData.filter((parcel) =>
          parcel.province.toLowerCase().includes(filter.value.toLowerCase())
        )
      }

      if (filter.type === "month" && filter.value) {
        filteredData = filteredData.filter((parcel) => {
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
        filteredData = filteredData.filter((parcel) => {
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

    // Now filter by region if not "all"
    const sourceData = { data: currentRegion === "all" ? filteredData : filteredData.filter((parcel) => parcel.region === currentRegion), stats: {}, provinces: {}, regions: {}, total: 0, winningShippers: {}, rtsShippers: {} }

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
      .filter((p) => rtsStatuses.includes(p.normalizedStatus))
      .reduce((acc, parcel) => {
        const province = parcel.province || "Unknown"
        acc[province] = (acc[province] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topReturnedProvinces = Object.entries(rtsProvinceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Region success rates
    const regionSuccessRates = []
    if (currentRegion === "all") {
      // All Regions using filtered data
      const total = filteredData.length
      const delivered = filteredData.filter((p) => p.normalizedStatus === "DELIVERED").length
      const successRate = total > 0 ? (delivered / total) * 100 : 0
      regionSuccessRates.push({ region: "All Regions", successRate, deliveredCount: delivered, totalCount: total })

      // Individual regions using filtered data
      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.region === region)
        const total = regionFilteredData.length
        const delivered = regionFilteredData.filter((p) => p.normalizedStatus === "DELIVERED").length
        const successRate = total > 0 ? (delivered / total) * 100 : 0
        regionSuccessRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), successRate, deliveredCount: delivered, totalCount: total })
      })
    } else {
      // Only show the current region using filtered data
      const total = sourceData.data.length
      const delivered = sourceData.data.filter((p) => p.normalizedStatus === "DELIVERED").length
      const successRate = total > 0 ? (delivered / total) * 100 : 0
      regionSuccessRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), successRate, deliveredCount: delivered, totalCount: total })
    }

    // Region RTS rates
    const regionRTSRates = []
    if (currentRegion === "all") {
      // All Regions using filtered data
      const total = filteredData.length
      const rts = filteredData.filter((p) => rtsStatuses.includes(p.normalizedStatus)).length
      const rtsRate = total > 0 ? (rts / total) * 100 : 0
      regionRTSRates.push({ region: "All Regions", rtsRate, rtsCount: rts, totalCount: total })

      // Individual regions using filtered data
      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.region === region)
        const total = regionFilteredData.length
        const rts = regionFilteredData.filter((p) => rtsStatuses.includes(p.normalizedStatus)).length
        const rtsRate = total > 0 ? (rts / total) * 100 : 0
        regionRTSRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), rtsRate, rtsCount: rts, totalCount: total })
      })
    } else {
      // Only show the current region using filtered data
      const total = sourceData.data.length
      const rts = sourceData.data.filter((p) => rtsStatuses.includes(p.normalizedStatus)).length
      const rtsRate = total > 0 ? (rts / total) * 100 : 0
      regionRTSRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), rtsRate, rtsCount: rts, totalCount: total })
    }

    // Top regions by delivery count
    const regionCounts = sourceData.data.reduce((acc, parcel) => {
      const region = parcel.region || "Unknown"
      acc[region] = (acc[region] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topRegions = Object.entries(regionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Top regions by RTS count
    const rtsRegionCounts = sourceData.data
      .filter((p) => rtsStatuses.includes(p.normalizedStatus))
      .reduce((acc, parcel) => {
        const region = parcel.region || "Unknown"
        acc[region] = (acc[region] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topReturnedRegions = Object.entries(rtsRegionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    return {
      topProvinces,
      topReturnedProvinces,
      topRegions,
      topReturnedRegions,
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
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Performance Report</h1>
        <p className="text-muted-foreground">Comprehensive performance analysis and RTS impact</p>
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

      {/* Region Success Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionSuccessRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} Success Rate</h3>
                <p className="text-sm text-muted-foreground">Percentage of successful deliveries</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-500">{item.successRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.deliveredCount.toLocaleString()} delivered out of {item.totalCount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Region RTS Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionRTSRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-red-500/50">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} RTS Rate</h3>
                <p className="text-sm text-muted-foreground">Return to sender percentage</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-red-500">{item.rtsRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.rtsCount.toLocaleString()} RTS out of {item.totalCount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Delivered Results */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Delivered Results</h2>
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

          <div className="glass rounded-xl p-6 border border-purple-500/50">
            <h3 className="text-xl font-bold text-foreground mb-4">Top Regions by Delivery Count</h3>
            <div className="space-y-3">
              {topRegions.map(([region, count], index) => (
                <div key={region} className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-purple-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-medium text-foreground">{region}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-500">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Returned Results */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Returned Results</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <div className="glass rounded-xl p-6 border border-orange-500/50">
            <h3 className="text-xl font-bold text-foreground mb-4">Top Regions by RTS Count</h3>
            <div className="space-y-3">
              {topReturnedRegions.map(([region, count], index) => (
                <div key={region} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-medium text-foreground">{region}</span>
                  </div>
                  <span className="text-sm font-bold text-orange-500">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
