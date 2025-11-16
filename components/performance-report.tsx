"use client"

import { useMemo, useState, useEffect } from "react"
import { CheckCircle, XCircle, Truck, Package, MapPin, X, Lock, AlertTriangle } from "lucide-react"
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
  regionOnDeliveryRates: { region: string; onDeliveryRate: number; onDeliveryCount: number; totalCount: number }[]
  regionPickupRates: { region: string; pickupRate: number; pickupCount: number; totalCount: number }[]
  regionInTransitRates: { region: string; inTransitRate: number; inTransitCount: number; totalCount: number }[]
  regionCancelledRates: { region: string; cancelledRate: number; cancelledCount: number; totalCount: number }[]
  regionDetainedRates: { region: string; detainedRate: number; detainedCount: number; totalCount: number }[]
  regionProblematicRates: { region: string; problematicRate: number; problematicCount: number; totalCount: number }[]
}

export function PerformanceReport({ data, filter, onFilterChange }: PerformanceReportProps) {
  const [currentRegion, setCurrentRegion] = useState<string>("all")
  const [filterType, setFilterType] = useState<"all" | "province" | "month" | "year">(filter.type)
  const [filterValue, setFilterValue] = useState(filter.value)

  useEffect(() => {
    setFilterType(filter.type)
    setFilterValue(filter.value)
  }, [filter])

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
    regionOnDeliveryRates,
    regionPickupRates,
    regionInTransitRates,
    regionCancelledRates,
    regionDetainedRates,
    regionProblematicRates,
  }: PerformanceData = useMemo(() => {
    if (!data)
      return {
        topProvinces: [],
        topReturnedProvinces: [],
        topRegions: [],
        topReturnedRegions: [],
        regionSuccessRates: [],
        regionRTSRates: [],
        regionOnDeliveryRates: [],
        regionPickupRates: [],
        regionInTransitRates: [],
        regionCancelledRates: [],
        regionDetainedRates: [],
        regionProblematicRates: [],
      }

    const rtsStatuses = ["RETURNED"]

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
    const sourceData = { data: currentRegion === "all" ? filteredData : filteredData.filter((parcel) => parcel.island === currentRegion), stats: {}, provinces: {}, regions: {}, total: 0, winningShippers: {}, rtsShippers: {} }

    // Top provinces by delivery count
    const provinceCounts = sourceData.data
      .filter((parcel) => parcel.normalizedStatus === "DELIVERED")
      .reduce((acc, parcel) => {
        const province = parcel.province || "Unknown"
        acc[province] = (acc[province] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topProvinces = Object.entries(provinceCounts)
      .filter(([province]) => province !== "Unknown")
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
      .filter(([province]) => province !== "Unknown")
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Region delivery rates (based on total parcels)
    const regionSuccessRates: { region: string; successRate: number; deliveredCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      // All Regions using filtered data
      const delivered = filteredData.filter((p) => p.normalizedStatus === "DELIVERED").length
      const total = filteredData.length
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0
      regionSuccessRates.push({ region: "All Regions", successRate: deliveryRate, deliveredCount: delivered, totalCount: total })

      // Individual regions using filtered data
      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const delivered = regionFilteredData.filter((p) => p.normalizedStatus === "DELIVERED").length
        const total = regionFilteredData.length
        const deliveryRate = total > 0 ? (delivered / total) * 100 : 0
        regionSuccessRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), successRate: deliveryRate, deliveredCount: delivered, totalCount: total })
      })
    } else {
      // Only show the current region using filtered data
      const delivered = sourceData.data.filter((p) => p.normalizedStatus === "DELIVERED").length
      const total = sourceData.data.length
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0
      regionSuccessRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), successRate: deliveryRate, deliveredCount: delivered, totalCount: total })
    }

    // Region RTS rates (based on total parcels)
    const regionRTSRates: { region: string; rtsRate: number; rtsCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      // All Regions using filtered data
      const rts = filteredData.filter((p) => rtsStatuses.includes(p.normalizedStatus)).length
      const total = filteredData.length
      const rtsRate = total > 0 ? (rts / total) * 100 : 0
      regionRTSRates.push({ region: "All Regions", rtsRate, rtsCount: rts, totalCount: total })

      // Individual regions using filtered data
      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const rts = regionFilteredData.filter((p) => rtsStatuses.includes(p.normalizedStatus)).length
        const total = regionFilteredData.length
        const rtsRate = total > 0 ? (rts / total) * 100 : 0
        regionRTSRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), rtsRate, rtsCount: rts, totalCount: total })
      })
    } else {
      // Only show the current region using filtered data
      const rts = sourceData.data.filter((p) => rtsStatuses.includes(p.normalizedStatus)).length
      const total = sourceData.data.length
      const rtsRate = total > 0 ? (rts / total) * 100 : 0
      regionRTSRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), rtsRate, rtsCount: rts, totalCount: total })
    }

    // Top regions by delivery count
    const regionCounts = sourceData.data
      .filter((parcel) => parcel.normalizedStatus === "DELIVERED")
      .reduce((acc, parcel) => {
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

    // Region On Delivery rates
    const regionOnDeliveryRates: { region: string; onDeliveryRate: number; onDeliveryCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      const onDelivery = filteredData.filter((p) => p.normalizedStatus === "ON_DELIVERY").length
      const total = filteredData.length
      const onDeliveryRate = total > 0 ? (onDelivery / total) * 100 : 0
      regionOnDeliveryRates.push({ region: "All Regions", onDeliveryRate, onDeliveryCount: onDelivery, totalCount: total })

      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const onDelivery = regionFilteredData.filter((p) => p.normalizedStatus === "ON_DELIVERY").length
        const total = regionFilteredData.length
        const onDeliveryRate = total > 0 ? (onDelivery / total) * 100 : 0
        regionOnDeliveryRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), onDeliveryRate, onDeliveryCount: onDelivery, totalCount: total })
      })
    } else {
      const onDelivery = sourceData.data.filter((p) => p.normalizedStatus === "ON_DELIVERY").length
      const total = sourceData.data.length
      const onDeliveryRate = total > 0 ? (onDelivery / total) * 100 : 0
      regionOnDeliveryRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), onDeliveryRate, onDeliveryCount: onDelivery, totalCount: total })
    }

    // Region Pickup rates
    const regionPickupRates: { region: string; pickupRate: number; pickupCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      const pickup = filteredData.filter((p) => p.normalizedStatus === "PICKUP").length
      const total = filteredData.length
      const pickupRate = total > 0 ? (pickup / total) * 100 : 0
      regionPickupRates.push({ region: "All Regions", pickupRate, pickupCount: pickup, totalCount: total })

      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const pickup = regionFilteredData.filter((p) => p.normalizedStatus === "PICKUP").length
        const total = regionFilteredData.length
        const pickupRate = total > 0 ? (pickup / total) * 100 : 0
        regionPickupRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), pickupRate, pickupCount: pickup, totalCount: total })
      })
    } else {
      const pickup = sourceData.data.filter((p) => p.normalizedStatus === "PICKUP").length
      const total = sourceData.data.length
      const pickupRate = total > 0 ? (pickup / total) * 100 : 0
      regionPickupRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), pickupRate, pickupCount: pickup, totalCount: total })
    }

    // Region In Transit rates
    const regionInTransitRates: { region: string; inTransitRate: number; inTransitCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      const inTransit = filteredData.filter((p) => p.normalizedStatus === "IN_TRANSIT").length
      const total = filteredData.length
      const inTransitRate = total > 0 ? (inTransit / total) * 100 : 0
      regionInTransitRates.push({ region: "All Regions", inTransitRate, inTransitCount: inTransit, totalCount: total })

      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const inTransit = regionFilteredData.filter((p) => p.normalizedStatus === "IN_TRANSIT").length
        const total = regionFilteredData.length
        const inTransitRate = total > 0 ? (inTransit / total) * 100 : 0
        regionInTransitRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), inTransitRate, inTransitCount: inTransit, totalCount: total })
      })
    } else {
      const inTransit = sourceData.data.filter((p) => p.normalizedStatus === "IN_TRANSIT").length
      const total = sourceData.data.length
      const inTransitRate = total > 0 ? (inTransit / total) * 100 : 0
      regionInTransitRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), inTransitRate, inTransitCount: inTransit, totalCount: total })
    }

    // Region Cancelled rates
    const regionCancelledRates: { region: string; cancelledRate: number; cancelledCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      const cancelled = filteredData.filter((p) => p.normalizedStatus === "CANCELLED").length
      const total = filteredData.length
      const cancelledRate = total > 0 ? (cancelled / total) * 100 : 0
      regionCancelledRates.push({ region: "All Regions", cancelledRate, cancelledCount: cancelled, totalCount: total })

      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const cancelled = regionFilteredData.filter((p) => p.normalizedStatus === "CANCELLED").length
        const total = regionFilteredData.length
        const cancelledRate = total > 0 ? (cancelled / total) * 100 : 0
        regionCancelledRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), cancelledRate, cancelledCount: cancelled, totalCount: total })
      })
    } else {
      const cancelled = sourceData.data.filter((p) => p.normalizedStatus === "CANCELLED").length
      const total = sourceData.data.length
      const cancelledRate = total > 0 ? (cancelled / total) * 100 : 0
      regionCancelledRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), cancelledRate, cancelledCount: cancelled, totalCount: total })
    }

    // Region Detained rates
    const regionDetainedRates: { region: string; detainedRate: number; detainedCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      const detained = filteredData.filter((p) => p.normalizedStatus === "DETAINED").length
      const total = filteredData.length
      const detainedRate = total > 0 ? (detained / total) * 100 : 0
      regionDetainedRates.push({ region: "All Regions", detainedRate, detainedCount: detained, totalCount: total })

      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const detained = regionFilteredData.filter((p) => p.normalizedStatus === "DETAINED").length
        const total = regionFilteredData.length
        const detainedRate = total > 0 ? (detained / total) * 100 : 0
        regionDetainedRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), detainedRate, detainedCount: detained, totalCount: total })
      })
    } else {
      const detained = sourceData.data.filter((p) => p.normalizedStatus === "DETAINED").length
      const total = sourceData.data.length
      const detainedRate = total > 0 ? (detained / total) * 100 : 0
      regionDetainedRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), detainedRate, detainedCount: detained, totalCount: total })
    }

    // Region Problematic rates
    const regionProblematicRates: { region: string; problematicRate: number; problematicCount: number; totalCount: number }[] = []
    if (currentRegion === "all") {
      const problematic = filteredData.filter((p) => p.normalizedStatus === "PROBLEMATIC").length
      const total = filteredData.length
      const problematicRate = total > 0 ? (problematic / total) * 100 : 0
      regionProblematicRates.push({ region: "All Regions", problematicRate, problematicCount: problematic, totalCount: total })

      const regionNames = ["luzon", "visayas", "mindanao"]
      regionNames.forEach((region) => {
        const regionFilteredData = filteredData.filter((parcel) => parcel.island === region)
        const problematic = regionFilteredData.filter((p) => p.normalizedStatus === "PROBLEMATIC").length
        const total = regionFilteredData.length
        const problematicRate = total > 0 ? (problematic / total) * 100 : 0
        regionProblematicRates.push({ region: region.charAt(0).toUpperCase() + region.slice(1), problematicRate, problematicCount: problematic, totalCount: total })
      })
    } else {
      const problematic = sourceData.data.filter((p) => p.normalizedStatus === "PROBLEMATIC").length
      const total = sourceData.data.length
      const problematicRate = total > 0 ? (problematic / total) * 100 : 0
      regionProblematicRates.push({ region: currentRegion.charAt(0).toUpperCase() + currentRegion.slice(1), problematicRate, problematicCount: problematic, totalCount: total })
    }

    return {
      topProvinces,
      topReturnedProvinces,
      topRegions,
      topReturnedRegions,
      regionSuccessRates,
      regionRTSRates,
      regionOnDeliveryRates,
      regionPickupRates,
      regionInTransitRates,
      regionCancelledRates,
      regionDetainedRates,
      regionProblematicRates,
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
                <h3 className="text-lg font-bold text-foreground">{item.region} Delivery Rate</h3>
                <p className="text-sm text-muted-foreground">Percentage of successful deliveries out of total parcels</p>
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

      {/* Region On Delivery Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionOnDeliveryRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-yellow-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-8 h-8 text-yellow-500" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} On Delivery Rate</h3>
                <p className="text-sm text-muted-foreground">Parcels currently on delivery</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-500">{item.onDeliveryRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.onDeliveryCount.toLocaleString()} on delivery out of {item.totalCount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Region Pickup Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionPickupRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-blue-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} Pickup Rate</h3>
                <p className="text-sm text-muted-foreground">Parcels ready for pickup</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-500">{item.pickupRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.pickupCount.toLocaleString()} pickup out of {item.totalCount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Region In Transit Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionInTransitRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-purple-500/50">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} In Transit Rate</h3>
                <p className="text-sm text-muted-foreground">Parcels currently in transit</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-500">{item.inTransitRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.inTransitCount.toLocaleString()} in transit out of {item.totalCount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Region Cancelled Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionCancelledRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-gray-500/50">
            <div className="flex items-center gap-3 mb-4">
              <X className="w-8 h-8 text-gray-500" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} Cancelled Rate</h3>
                <p className="text-sm text-muted-foreground">Cancelled parcels percentage</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-500">{item.cancelledRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.cancelledCount.toLocaleString()} cancelled out of {item.totalCount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Region Detained Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionDetainedRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-orange-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-orange-500" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} Detained Rate</h3>
                <p className="text-sm text-muted-foreground">Detained parcels percentage</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-500">{item.detainedRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.detainedCount.toLocaleString()} detained out of {item.totalCount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Region Problematic Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {regionProblematicRates.map((item) => (
          <div key={item.region} className="glass rounded-xl p-6 border border-red-600/50">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.region} Problematic Rate</h3>
                <p className="text-sm text-muted-foreground">Problematic parcels percentage</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">{item.problematicRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{item.problematicCount.toLocaleString()} problematic out of {item.totalCount.toLocaleString()}</p>
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
