"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StatusCard } from "@/components/status-card"
import type { ProcessedData, FilterState } from "@/lib/types"

interface DashboardViewProps {
  data: ProcessedData
  currentRegion: "all" | "luzon" | "visayas" | "mindanao"
  onRegionChange: (region: "all" | "luzon" | "visayas" | "mindanao") => void
  filter: FilterState
  onFilterChange: (filter: FilterState) => void
}

const STATUSES = ["DELIVERED", "ONDELIVERY", "PICKUP", "INTRANSIT", "CANCELLED", "DETAINED", "PROBLEMATIC", "RETURNED"]

const STATUS_COLORS = {
  DELIVERED: "from-green-500 to-green-600",
  ONDELIVERY: "from-blue-500 to-blue-600",
  PICKUP: "from-purple-500 to-purple-600",
  INTRANSIT: "from-orange-500 to-orange-600",
  CANCELLED: "from-red-500 to-red-600",
  DETAINED: "from-gray-600 to-gray-700",
  PROBLEMATIC: "from-orange-600 to-orange-700",
  RETURNED: "from-cyan-500 to-cyan-600",
}

export function DashboardView({ data, currentRegion, onRegionChange, filter, onFilterChange }: DashboardViewProps) {
  const [filterType, setFilterType] = useState<"all" | "province" | "month" | "year">("all")
  const [filterValue, setFilterValue] = useState("")

  const regionData = useMemo(() => {
    return data[currentRegion]
  }, [data, currentRegion])

  const filteredData = useMemo(() => {
    if (filter.type === "all") return regionData

    const filtered = regionData.data.filter((parcel) => {
      if (filter.type === "province") {
        return parcel.province.toLowerCase().includes(filter.value.toLowerCase())
      }
      if (filter.type === "month") {
        if (!parcel.date) return false
        let parcelMonth: number
        try {
          let d: Date
          if (typeof parcel.date === "number") {
            d = new Date(Date.UTC(1899, 11, 30) + parcel.date * 86400000)
          } else {
            d = new Date(parcel.date.toString().trim())
          }
          if (isNaN(d.getTime())) {
            const parts = parcel.date.toString().split(" ")[0].split("-")
            parcelMonth = Number.parseInt(parts[1], 10)
          } else {
            parcelMonth = d.getMonth() + 1
          }
        } catch (e) {
          const parts = parcel.date.toString().split(" ")[0].split("-")
          parcelMonth = Number.parseInt(parts[1], 10)
        }
        return parcelMonth === Number.parseInt(filter.value, 10)
      }
      if (filter.type === "year") {
        if (!parcel.date) return false
        let parcelYear: number
        try {
          let d: Date
          if (typeof parcel.date === "number") {
            d = new Date(Date.UTC(1899, 11, 30) + parcel.date * 86400000)
          } else {
            d = new Date(parcel.date.toString().trim())
          }
          if (isNaN(d.getTime())) {
            const parts = parcel.date.toString().split(" ")[0].split("-")
            parcelYear = Number.parseInt(parts[0], 10)
          } else {
            parcelYear = d.getFullYear()
          }
        } catch (e) {
          const parts = parcel.date.toString().split(" ")[0].split("-")
          parcelYear = Number.parseInt(parts[0], 10)
        }
        return parcelYear === Number.parseInt(filter.value, 10)
      }
      return true
    })

    // Recalculate stats for filtered data
    const stats: any = {}
    const provinces: any = {}
    const regions: any = {}
    let total = 0
    const winningShippers: any = {}
    const rtsShippers: any = {}

    STATUSES.forEach((status) => {
      stats[status] = { count: 0, locations: {} }
    })

    filtered.forEach((parcel) => {
      total++
      const status = parcel.normalizedStatus
      const province = parcel.province
      const region = parcel.region

      if (STATUSES.includes(status)) {
        stats[status].count++
        stats[status].locations[province] = (stats[status].locations[province] || 0) + 1
      }

      provinces[province] = (provinces[province] || 0) + 1
      regions[region] = (regions[region] || 0) + 1

      if (status === "DELIVERED") {
        winningShippers[parcel.shipper] = (winningShippers[parcel.shipper] || 0) + 1
      }

      const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
      if (rtsStatuses.includes(status)) {
        rtsShippers[parcel.shipper] = (rtsShippers[parcel.shipper] || 0) + 1
      }
    })

    return {
      data: filtered,
      stats,
      provinces,
      regions,
      total,
      winningShippers,
      rtsShippers,
    }
  }, [regionData, filter])

  const displayData = filter.type === "all" ? regionData : filteredData

  const rtsPercentage = useMemo(() => {
    const rtsCount =
      displayData.stats.CANCELLED.count + displayData.stats.PROBLEMATIC.count + displayData.stats.RETURNED.count
    return displayData.total > 0 ? ((rtsCount / displayData.total) * 100).toFixed(2) : "0.00"
  }, [displayData])

  const topProvinces = useMemo(() => {
    return Object.entries(displayData.provinces)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
  }, [displayData])

  const topRegions = useMemo(() => {
    return Object.entries(displayData.regions)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
  }, [displayData])

  const topRTSProvinces = useMemo(() => {
    const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
    const provinceRTSCounts: { [key: string]: number } = {}

    rtsStatuses.forEach((status) => {
      const statusLocations = displayData.stats[status].locations
      for (const [province, count] of Object.entries(statusLocations)) {
        provinceRTSCounts[province] = (provinceRTSCounts[province] || 0) + (count as number)
      }
    })

    return Object.entries(provinceRTSCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [displayData])

  const topWinningShippers = useMemo(() => {
    return Object.entries(displayData.winningShippers)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
  }, [displayData])

  const topRTSShippers = useMemo(() => {
    return Object.entries(displayData.rtsShippers)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
  }, [displayData])

  const handleApplyFilter = () => {
    if (filterType !== "all" && !filterValue) {
      alert("Please enter or select a value to filter.")
      return
    }
    onFilterChange({ type: filterType, value: filterValue })
  }

  const handleClearFilter = () => {
    setFilterType("all")
    setFilterValue("")
    onFilterChange({ type: "all", value: "" })
  }

  const regionName =
    currentRegion === "all" ? "All Regions" : currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1)

  return (
    <div>
      {/* Region Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant={currentRegion === "all" ? "default" : "outline"}
            onClick={() => onRegionChange("all")}
            className="font-medium"
          >
            All Regions
          </Button>
          <Button
            variant={currentRegion === "luzon" ? "default" : "outline"}
            onClick={() => onRegionChange("luzon")}
            className="font-medium"
          >
            Luzon
          </Button>
          <Button
            variant={currentRegion === "visayas" ? "default" : "outline"}
            onClick={() => onRegionChange("visayas")}
            className="font-medium"
          >
            Visayas
          </Button>
          <Button
            variant={currentRegion === "mindanao" ? "default" : "outline"}
            onClick={() => onRegionChange("mindanao")}
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
              setFilterType(e.target.value as any)
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

      {/* Summary Card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-2">{regionName} Dashboard</h3>
            <p className="text-sm">
              Total Parcels: <strong className="text-lg">{displayData.total.toLocaleString()}</strong>
            </p>
            <p className="text-sm mt-1">
              OVER ALL RTS Percentage: <strong className="text-lg">{rtsPercentage}%</strong>
            </p>
          </div>

          <div className="col-span-1">
            <h5 className="font-semibold mb-2">Top Provinces</h5>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {topProvinces.map(([province, count]) => (
                <div key={province}>
                  {province}: <strong>{count as number}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1">
            <h5 className="font-semibold mb-2">Regions</h5>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {topRegions.map(([region, count]) => (
                <div key={region}>
                  {region}: <strong>{count as number}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1">
            <h5 className="font-semibold mb-2">Top RTS</h5>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {topRTSProvinces.length > 0 ? (
                topRTSProvinces.map(([province, count]) => (
                  <div key={province}>
                    {province}: <strong>{count}</strong>
                  </div>
                ))
              ) : (
                <div className="text-sm">No data</div>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <h5 className="font-semibold mb-2">Winning Products</h5>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {topWinningShippers.length > 0 ? (
                topWinningShippers.map(([shipper, count]) => (
                  <div key={shipper}>
                    {shipper}: <strong>{count as number}</strong>
                  </div>
                ))
              ) : (
                <div className="text-sm">No data</div>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <h5 className="font-semibold mb-2">RTS Products</h5>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {topRTSShippers.length > 0 ? (
                topRTSShippers.map(([shipper, count]) => (
                  <div key={shipper}>
                    {shipper}: <strong>{count as number}</strong>
                  </div>
                ))
              ) : (
                <div className="text-sm">No data</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <StatusCard
            key={status}
            status={status}
            count={displayData.stats[status].count}
            locations={displayData.stats[status].locations}
            colorClass={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}
          />
        ))}
      </div>
    </div>
  )
}
