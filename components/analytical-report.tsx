"use client"

import { useMemo, useState } from "react"
import { PieChart, MapPin, PackageX, TrendingUp, Users, Map, BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import type { ProcessedData, FilterState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { philippineRegions } from "@/lib/philippine-regions"

interface AnalyticalReportProps {
  data: ProcessedData | null
}

export function AnalyticalReport({ data }: AnalyticalReportProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")
  const [filter, setFilter] = useState<FilterState>({ type: "all", value: "" })

  const { predictiveRiskData, riskByRegion, rfmSegmentationData, geospatialData, abcAnalysisData } = useMemo(() => {
    if (!data) return {
      predictiveRiskData: null,
      riskByRegion: {},
      rfmSegmentationData: null,
      geospatialData: null,
      abcAnalysisData: null
    }

    const sourceData = currentRegion === "all" ? data.all : data[currentRegion]
    const filtered = filter.type === "all" ? sourceData.data : sourceData.data.filter((parcel) => {
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

    // Predictive Risk Dashboard - Return probability heatmap
    const returnProbabilities: { [key: string]: { [key: string]: number } } = {}
    const rtsStatuses = ["CANCELLED", "PROBLEMATIC", "RETURNED"]

    filtered.forEach((parcel) => {
      const province = parcel.province
      const shipper = parcel.shipper
      if (!returnProbabilities[province]) returnProbabilities[province] = {}
      if (!returnProbabilities[province][shipper]) returnProbabilities[province][shipper] = 0

      if (rtsStatuses.includes(parcel.normalizedStatus)) {
        returnProbabilities[province][shipper] += 1
      }
    })

    // Calculate return probabilities
    const predictiveRiskData = Object.entries(returnProbabilities).map(([province, shippers]) => ({
      province,
      shippers: Object.entries(shippers).map(([shipper, returns]) => ({
        shipper,
        returnProbability: returns / filtered.filter(p => p.province === province && p.shipper === shipper).length
      }))
    }))

    // Group by region
    const riskByRegion: { [region: string]: { province: string, returnProbability: number }[] } = {}
    predictiveRiskData?.forEach(provinceData => {
      let region = 'unknown'
      for (const [island, islandData] of Object.entries(philippineRegions)) {
        for (const [reg, provinces] of Object.entries(islandData.provinces)) {
          if (provinces.includes(provinceData.province)) {
            region = reg
            break
          }
        }
        if (region !== 'unknown') break
      }
      if (!riskByRegion[region]) riskByRegion[region] = []
      const totalReturns = provinceData.shippers.reduce((sum, shipper) => sum + shipper.returnProbability, 0)
      const avgReturnProbability = provinceData.shippers.length > 0 ? totalReturns / provinceData.shippers.length : 0
      riskByRegion[region].push({
        province: provinceData.province,
        returnProbability: avgReturnProbability * 100
      })
    })

    // Customer Intelligence Matrix - RFM segmentation
    const customerRFM: { [key: string]: { recency: number, frequency: number, monetary: number } } = {}
    filtered.forEach((parcel) => {
      const customer = parcel.shipper
      if (!customerRFM[customer]) {
        customerRFM[customer] = { recency: 0, frequency: 0, monetary: 0 }
      }
      customerRFM[customer].frequency += 1
      // Assuming monetary value is based on some metric, using frequency as proxy for now
      customerRFM[customer].monetary += 1
    })

    const rfmSegmentationData = Object.entries(customerRFM).map(([customer, rfm]) => ({
      customer,
      ...rfm,
      segment: rfm.frequency > 10 ? 'High Value' : rfm.frequency > 5 ? 'Medium Value' : 'Low Value'
    }))

    // Geospatial Optimization Map - Delivery efficiency layers
    const provinceEfficiency: { [key: string]: { total: number, successful: number, avgTime: number } } = {}
    filtered.forEach((parcel) => {
      const province = parcel.province
      if (!provinceEfficiency[province]) {
        provinceEfficiency[province] = { total: 0, successful: 0, avgTime: 0 }
      }
      provinceEfficiency[province].total += 1
      if (!rtsStatuses.includes(parcel.normalizedStatus)) {
        provinceEfficiency[province].successful += 1
      }
    })

    const geospatialData = Object.entries(provinceEfficiency).map(([province, data]) => ({
      province,
      efficiency: data.successful / data.total,
      totalDeliveries: data.total,
      coordinates: { lat: 0, lng: 0 } // Placeholder coordinates
    }))

    // Portfolio Performance Grid - ABC analysis
    const shipperPerformance: { [key: string]: { revenue: number, volume: number } } = {}
    filtered.forEach((parcel) => {
      const shipper = parcel.shipper
      if (!shipperPerformance[shipper]) {
        shipperPerformance[shipper] = { revenue: 0, volume: 0 }
      }
      shipperPerformance[shipper].volume += 1
      shipperPerformance[shipper].revenue += 1 // Using volume as revenue proxy
    })

    const sortedShippers = Object.entries(shipperPerformance)
      .sort(([, a], [, b]) => b.revenue - a.revenue)

    const totalRevenue = sortedShippers.reduce((sum, [, data]) => sum + data.revenue, 0)
    let cumulativeRevenue = 0

    const abcAnalysisData = sortedShippers.map(([shipper, data], index) => {
      cumulativeRevenue += data.revenue
      const percentage = (cumulativeRevenue / totalRevenue) * 100
      let category = 'C'
      if (percentage <= 80) category = 'A'
      else if (percentage <= 95) category = 'B'

      return {
        shipper,
        revenue: data.revenue,
        volume: data.volume,
        category,
        cumulativePercentage: percentage
      }
    })

    return {
      predictiveRiskData,
      riskByRegion,
      rfmSegmentationData,
      geospatialData,
      abcAnalysisData
    }
  }, [data, currentRegion, filter])

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
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">ANALYTICAL REPORT</h1>
        <p className="text-muted-foreground">Deep insights into regional distribution and shipper performance</p>
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

      {/* Predictive Risk Dashboard - Return probability bar chart per region */}
      <div className="glass rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-foreground">Predictive Risk Dashboard</h2>
        </div>
        <p className="text-muted-foreground mb-4">Return probability by province per region</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(riskByRegion).map(([region, provinces]) => (
            <Card key={region} className="glass rounded-xl border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">{region.toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  id={`predictive-risk-${region}`}
                  config={{
                    returnProbability: { label: "Return Probability", color: "rgba(239, 68, 68, 1)" },
                  }}
                  className="h-48"
                >
                    <BarChart data={provinces} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
                      <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                      <XAxis type="number" unit="%" stroke="#888" domain={[0, 'dataMax']} />
                      <YAxis dataKey="province" type="category" width={80} stroke="#888" tickLine={true} axisLine={true} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="returnProbability" fill="rgba(255, 99, 71, 1)" barSize={20} maxBarSize={30} minPointSize={5} stroke="#000" strokeWidth={1} />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Customer Intelligence Matrix - RFM segmentation chart */}
      <div className="glass rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-foreground">Customer Intelligence Matrix</h2>
        </div>
        <p className="text-muted-foreground mb-4">RFM segmentation analysis</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rfmSegmentationData?.slice(0, 9).map((customer) => (
            <div key={customer.customer} className="p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground truncate">{customer.customer}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  customer.segment === 'High Value' ? 'bg-green-500/20 text-green-700' :
                  customer.segment === 'Medium Value' ? 'bg-yellow-500/20 text-yellow-700' :
                  'bg-red-500/20 text-red-700'
                }`}>
                  {customer.segment}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Frequency:</span>
                  <span className="font-bold">{customer.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monetary:</span>
                  <span className="font-bold">{customer.monetary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geospatial Optimization Map - Delivery efficiency layers */}
      <div className="glass rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <Map className="w-6 h-6 text-green-500" />
          <h2 className="text-xl font-bold text-foreground">Geospatial Optimization Map</h2>
        </div>
        <p className="text-muted-foreground mb-4">Delivery efficiency by province</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {geospatialData?.slice(0, 12).map((province) => (
            <div key={province.province} className="p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{province.province}</span>
                <span className="text-sm font-bold text-green-600">
                  {(province.efficiency * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${province.efficiency * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {province.totalDeliveries} total deliveries
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Performance Grid - ABC analysis visualization */}
      <div className="glass rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold text-foreground">Portfolio Performance Grid</h2>
        </div>
        <p className="text-muted-foreground mb-4">ABC analysis of shipper performance</p>
        <div className="space-y-3">
          {abcAnalysisData?.slice(0, 10).map((shipper, index) => (
            <div key={shipper.shipper} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  shipper.category === 'A' ? 'bg-green-500/20 text-green-700' :
                  shipper.category === 'B' ? 'bg-yellow-500/20 text-yellow-700' :
                  'bg-red-500/20 text-red-700'
                }`}>
                  {shipper.category}
                </span>
                <span className="text-sm font-medium text-foreground">{shipper.shipper}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">{shipper.revenue}</div>
                <div className="text-xs text-muted-foreground">{shipper.cumulativePercentage.toFixed(1)}% cumulative</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
