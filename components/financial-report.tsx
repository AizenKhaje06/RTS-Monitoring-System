"use client"

import { useMemo, useState } from "react"
import { DollarSign, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import type { ProcessedData, FilterState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FinancialReportProps {
  data: ProcessedData | null
}

export function FinancialReport({ data }: FinancialReportProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")
  const [filter, setFilter] = useState<FilterState>({ type: "all", value: "" })

  const financialData = useMemo(() => {
    if (!data) return null

    const sourceData = currentRegion === "all" ? data.all : data[currentRegion]

    if (filter.type === "all") {
      const filtered = sourceData.data

      // Calculate financial metrics
      const totalCOD = filtered.reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0)
      const totalServiceCharge = filtered.reduce((sum, parcel) => sum + (parcel.serviceCharge || 0), 0)
      const totalShippingCost = filtered.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
      const totalRTSFee = filtered.reduce((sum, parcel) => sum + (parcel.rtsFee || 0), 0)

      // Calculate RTS-specific costs
      const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
      const rtsParcels = filtered.filter((p) => rtsStatuses.includes(p.normalizedStatus))
      const rtsShippingCost = rtsParcels.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
      const rtsFeeLost = rtsParcels.reduce((sum, parcel) => sum + (parcel.rtsFee || 0), 0)

      const grossProfit = totalCOD - totalShippingCost
      const netProfit = grossProfit - rtsShippingCost - rtsFeeLost

      return {
        totalCOD,
        totalServiceCharge,
        totalShippingCost,
        totalRTSFee,
        rtsParcelsCount: rtsParcels.length,
        rtsShippingCost,
        rtsFeeLost,
        grossProfit,
        netProfit,
      }
    }

    const filtered = sourceData.data.filter((parcel) => {
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

    // Calculate financial metrics
    const totalCOD = filtered.reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0)
    const totalServiceCharge = filtered.reduce((sum, parcel) => sum + (parcel.serviceCharge || 0), 0)
    const totalShippingCost = filtered.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
    const totalRTSFee = filtered.reduce((sum, parcel) => sum + (parcel.rtsFee || 0), 0)

    // Calculate RTS-specific costs
    const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]
    const rtsParcels = filtered.filter((p) => rtsStatuses.includes(p.normalizedStatus))
    const rtsShippingCost = rtsParcels.reduce((sum, parcel) => sum + (parcel.totalCost || 0), 0)
    const rtsFeeLost = rtsParcels.reduce((sum, parcel) => sum + (parcel.rtsFee || 0), 0)

    const grossProfit = totalCOD - totalShippingCost
    const netProfit = grossProfit - rtsShippingCost - rtsFeeLost

    return {
      totalCOD,
      totalServiceCharge,
      totalShippingCost,
      totalRTSFee,
      rtsParcelsCount: rtsParcels.length,
      rtsShippingCost,
      rtsFeeLost,
      grossProfit,
      netProfit,
    }
  }, [data, currentRegion, filter])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Upload data to view financial impact analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">FINANCIAL IMPACT REPORT</h1>
        <p className="text-muted-foreground">Comprehensive financial analysis and RTS cost impact</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total COD Amount</p>
          <p className="text-3xl font-bold text-foreground">
            ₱
            {financialData?.totalCOD.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"}
          </p>
        </div>

        <div className="glass rounded-xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Service Charge</p>
          <p className="text-3xl font-bold text-foreground">
            ₱
            {financialData?.totalServiceCharge.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"}
          </p>
        </div>

        <div className="glass rounded-xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Shipping Cost</p>
          <p className="text-3xl font-bold text-foreground">
            ₱
            {financialData?.totalShippingCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"}
          </p>
        </div>

        <div className="glass rounded-xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total RTS Fee (20%)</p>
          <p className="text-3xl font-bold text-foreground">
            ₱
            {financialData?.totalRTSFee.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-green-500/50">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-foreground">Gross Profit</h2>
          </div>
          <p className="text-4xl font-bold text-green-500 mb-2">
            ₱
            {financialData?.grossProfit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"}
          </p>
          <p className="text-sm text-muted-foreground">Total COD - Shipping Costs</p>
        </div>

        <div className="glass rounded-xl p-6 border border-blue-500/50">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-foreground">Net Profit</h2>
          </div>
          <p className="text-4xl font-bold text-blue-500 mb-2">
            ₱
            {financialData?.netProfit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"}
          </p>
          <p className="text-sm text-muted-foreground">Gross Profit - RTS Impact</p>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-red-500/50">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold text-foreground">RTS Financial Impact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-red-500/10">
            <p className="text-sm text-muted-foreground mb-1">RTS Parcels</p>
            <p className="text-2xl font-bold text-foreground">{financialData?.rtsParcelsCount.toLocaleString() || 0}</p>
          </div>

          <div className="p-4 rounded-lg bg-red-500/10">
            <p className="text-sm text-muted-foreground mb-1">RTS Shipping Cost Lost</p>
            <p className="text-2xl font-bold text-red-500">
              ₱
              {financialData?.rtsShippingCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-500/10">
            <p className="text-sm text-muted-foreground mb-1">RTS Fee Impact</p>
            <p className="text-2xl font-bold text-red-500">
              ₱
              {financialData?.rtsFeeLost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-border/50">
        <h2 className="text-xl font-bold text-foreground mb-4">Financial Summary</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm font-medium text-muted-foreground">Total Revenue Potential (COD)</span>
            <span className="text-sm font-bold text-foreground">
              ₱
              {financialData?.totalCOD.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm font-medium text-muted-foreground">Total Operational Cost</span>
            <span className="text-sm font-bold text-foreground">
              ₱
              {financialData?.totalShippingCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm font-medium text-muted-foreground">Gross Profit</span>
            <span className="text-sm font-bold text-green-500">
              ₱
              {financialData?.grossProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm font-medium text-muted-foreground">RTS Cost Impact</span>
            <span className="text-sm font-bold text-red-500">
              -₱
              {financialData?.rtsShippingCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/20 border border-primary/50">
            <span className="text-base font-bold text-foreground">Net Profit</span>
            <span className="text-base font-bold text-primary">
              ₱
              {financialData?.netProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
