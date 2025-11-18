"use client"

import { useMemo, useState, useEffect } from "react"
import { CheckCircle, XCircle, Truck, Package, MapPin, X, Lock, AlertTriangle } from "lucide-react"
import type { ProcessedData, FilterState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  topMunicipalities: [string, number][]
  topReturnedMunicipalities: [string, number][]
  topBarangays: [string, number][]
  topReturnedBarangays: [string, number][]
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
    topMunicipalities,
    topReturnedMunicipalities,
    topBarangays,
    topReturnedBarangays,
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
        topMunicipalities: [],
        topReturnedMunicipalities: [],
        topBarangays: [],
        topReturnedBarangays: [],
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
        // Use the month from sheet name instead of date parsing
        filteredData = filteredData.filter((parcel) => {
          if (!parcel.month) return false
          const monthStr = parcel.month.toLowerCase().trim()
          const filterMonth = Number.parseInt(filter.value, 10)
          const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
          const monthIndex = monthNames.findIndex(name => monthStr.includes(name))
          return monthIndex + 1 === filterMonth
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

    // Top municipalities by delivery count
    const municipalityCounts = sourceData.data
      .filter((parcel) => parcel.normalizedStatus === "DELIVERED")
      .reduce((acc, parcel) => {
        const municipality = parcel.municipality || "Unknown"
        acc[municipality] = (acc[municipality] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topMunicipalities = Object.entries(municipalityCounts)
      .filter(([municipality]) => municipality !== "Unknown")
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Top municipalities by RTS count
    const rtsMunicipalityCounts = sourceData.data
      .filter((p) => rtsStatuses.includes(p.normalizedStatus))
      .reduce((acc, parcel) => {
        const municipality = parcel.municipality || "Unknown"
        acc[municipality] = (acc[municipality] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topReturnedMunicipalities = Object.entries(rtsMunicipalityCounts)
      .filter(([municipality]) => municipality !== "Unknown")
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Top barangays by delivery count
    const barangayCounts = sourceData.data
      .filter((parcel) => parcel.normalizedStatus === "DELIVERED")
      .reduce((acc, parcel) => {
        const barangay = parcel.barangay || "Unknown"
        acc[barangay] = (acc[barangay] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topBarangays = Object.entries(barangayCounts)
      .filter(([barangay]) => barangay !== "Unknown")
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][]

    // Top barangays by RTS count
    const rtsBarangayCounts = sourceData.data
      .filter((p) => rtsStatuses.includes(p.normalizedStatus))
      .reduce((acc, parcel) => {
        const barangay = parcel.barangay || "Unknown"
        acc[barangay] = (acc[barangay] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topReturnedBarangays = Object.entries(rtsBarangayCounts)
      .filter(([barangay]) => barangay !== "Unknown")
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
      topMunicipalities,
      topReturnedMunicipalities,
      topBarangays,
      topReturnedBarangays,
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

      {/* Performance Metrics Table */}
      <div className="glass rounded-xl p-6 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Performance Metrics by Region</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-semibold">Region</TableHead>
                <TableHead className="text-center font-semibold text-green-600">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Delivery Rate
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-red-600">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" />
                    RTS Rate
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-yellow-600">
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="w-4 h-4" />
                    On Delivery
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-blue-600">
                  <div className="flex items-center justify-center gap-2">
                    <Package className="w-4 h-4" />
                    Pickup
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-purple-600">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    In Transit
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />
                    Cancelled
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-orange-600">
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Detained
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-red-700">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Problematic
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regionSuccessRates.map((successItem, index) => {
                const rtsItem = regionRTSRates[index]
                const onDeliveryItem = regionOnDeliveryRates[index]
                const pickupItem = regionPickupRates[index]
                const inTransitItem = regionInTransitRates[index]
                const cancelledItem = regionCancelledRates[index]
                const detainedItem = regionDetainedRates[index]
                const problematicItem = regionProblematicRates[index]

                return (
                  <TableRow key={successItem.region}>
                    <TableCell className="font-medium">{successItem.region}</TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-green-600">{successItem.successRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {successItem.deliveredCount.toLocaleString()} / {successItem.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-red-600">{rtsItem?.rtsRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {rtsItem?.rtsCount.toLocaleString()} / {rtsItem?.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-yellow-600">{onDeliveryItem?.onDeliveryRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {onDeliveryItem?.onDeliveryCount.toLocaleString()} / {onDeliveryItem?.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-blue-600">{pickupItem?.pickupRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {pickupItem?.pickupCount.toLocaleString()} / {pickupItem?.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-purple-600">{inTransitItem?.inTransitRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {inTransitItem?.inTransitCount.toLocaleString()} / {inTransitItem?.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-gray-600">{cancelledItem?.cancelledRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {cancelledItem?.cancelledCount.toLocaleString()} / {cancelledItem?.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-orange-600">{detainedItem?.detainedRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {detainedItem?.detainedCount.toLocaleString()} / {detainedItem?.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-red-700">{problematicItem?.problematicRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {problematicItem?.problematicCount.toLocaleString()} / {problematicItem?.totalCount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="glass rounded-xl p-6 border border-green-500/50">
            <h3 className="text-xl font-bold text-foreground mb-4">Top Municipalities by Delivery Count</h3>
            <div className="space-y-3">
              {topMunicipalities.map(([municipality, count], index) => (
                <div key={municipality} className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-medium text-foreground">{municipality}</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-teal-500/50">
            <h3 className="text-xl font-bold text-foreground mb-4">Top Barangays by Delivery Count</h3>
            <div className="space-y-3">
              {topBarangays.map(([barangay, count], index) => (
                <div key={barangay} className="flex items-center justify-between p-3 rounded-lg bg-teal-500/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-teal-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-medium text-foreground">{barangay}</span>
                  </div>
                  <span className="text-sm font-bold text-teal-500">{count.toLocaleString()}</span>
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
