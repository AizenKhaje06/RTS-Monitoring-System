"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusCard } from "@/components/status-card"
import { TotalParcelCard } from "@/components/total-parcel-card"
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
      }
      if (filter.type === "year") {
        if (!parcel.date) return false
        const dateStr = parcel.date.toString().trim()
        let parcelYear = 0

        // Try to parse as standard date first
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          parcelYear = d.getFullYear()
        } else {
          // Fallback for YYYY-MM-DD HH:MM:SS format
          const datePart = dateStr.split(" ")[0]
          const parts = datePart.split("-")
          if (parts.length >= 3) {
            parcelYear = Number.parseInt(parts[0], 10)
          }
        }

        return parcelYear === Number.parseInt(filter.value, 10)
      }
      return true
    })

    // Recalculate stats for filtered data
    const stats: Record<string, { count: number; locations: Record<string, number> }> = {}
    const provinces: Record<string, number> = {}
    const regions: Record<string, number> = {}
    let total = 0
    const winningShippers: Record<string, number> = {}
    const rtsShippers: Record<string, number> = {}

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
        if (province && province !== "unknown location" && province !== "Unknown" && province.trim() !== "") {
          stats[status].locations[province] = (stats[status].locations[province] || 0) + 1
        }
      }

      if (province && province !== "unknown location" && province !== "Unknown" && province.trim() !== "") {
        provinces[province] = (provinces[province] || 0) + 1
      }
      regions[region] = (regions[region] || 0) + 1

      if (status === "DELIVERED") {
        winningShippers[parcel.shipper] = (winningShippers[parcel.shipper] || 0) + 1
      }

      const rtsStatuses = ["RETURNED"]
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

      <h3 className="text-xl font-semibold mb-4 text-foreground">Parcel Overview</h3>
      <div className="grid grid-cols-1 gap-4 mb-6">
        <TotalParcelCard total={displayData.total} />
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <StatusCard
            key={status}
            status={status}
            count={displayData.stats[status].count}
            locations={displayData.stats[status].locations}
            colorClass={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}
            total={displayData.total}
          />
        ))}
      </div>
    </div>
  )
}
