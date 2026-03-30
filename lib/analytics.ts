// Advanced analytics utilities

import type { ProcessedData, ParcelData } from "./types"

export interface TrendData {
  period: string
  delivered: number
  returned: number
  total: number
  deliveryRate: number
  rtsRate: number
}

export interface ComparisonData {
  metric: string
  current: number
  previous: number
  change: number
  changePercentage: number
  trend: "up" | "down" | "stable"
}

export interface PredictiveInsight {
  type: "warning" | "opportunity" | "info"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  recommendation: string
}

// Generate time-series trend data
export function generateTrendData(parcels: ParcelData[]): TrendData[] {
  const monthlyData = new Map<string, { delivered: number; returned: number; total: number }>()

  parcels.forEach(parcel => {
    const month = parcel.month || "Unknown"
    
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { delivered: 0, returned: 0, total: 0 })
    }

    const data = monthlyData.get(month)!
    data.total++

    if (parcel.normalizedStatus === "DELIVERED") {
      data.delivered++
    } else if (parcel.normalizedStatus === "RETURNED") {
      data.returned++
    }
  })

  return Array.from(monthlyData.entries())
    .map(([period, data]) => ({
      period,
      delivered: data.delivered,
      returned: data.returned,
      total: data.total,
      deliveryRate: data.total > 0 ? (data.delivered / data.total) * 100 : 0,
      rtsRate: data.total > 0 ? (data.returned / data.total) * 100 : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

// Compare two time periods
export function compareTimePeriods(
  currentParcels: ParcelData[],
  previousParcels: ParcelData[]
): ComparisonData[] {
  const calculateMetrics = (parcels: ParcelData[]) => {
    const total = parcels.length
    const delivered = parcels.filter(p => p.normalizedStatus === "DELIVERED").length
    const returned = parcels.filter(p => p.normalizedStatus === "RETURNED").length
    const grossSales = parcels
      .filter(p => p.normalizedStatus === "DELIVERED")
      .reduce((sum, p) => sum + (p.codAmount || 0), 0)
    const totalCost = parcels.reduce((sum, p) => sum + (p.totalCost || 0), 0)
    const rtsFee = parcels
      .filter(p => p.normalizedStatus === "RETURNED")
      .reduce((sum, p) => sum + (p.rtsFee || 0), 0)

    return {
      total,
      delivered,
      returned,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      rtsRate: total > 0 ? (returned / total) * 100 : 0,
      grossSales,
      totalCost,
      rtsFee,
      netProfit: grossSales - totalCost - rtsFee,
    }
  }

  const current = calculateMetrics(currentParcels)
  const previous = calculateMetrics(previousParcels)

  const createComparison = (metric: string, currentVal: number, previousVal: number): ComparisonData => {
    const change = currentVal - previousVal
    const changePercentage = previousVal !== 0 ? (change / previousVal) * 100 : 0
    
    let trend: "up" | "down" | "stable" = "stable"
    if (Math.abs(changePercentage) > 5) {
      trend = change > 0 ? "up" : "down"
    }

    return {
      metric,
      current: currentVal,
      previous: previousVal,
      change,
      changePercentage,
      trend,
    }
  }

  return [
    createComparison("Total Shipments", current.total, previous.total),
    createComparison("Delivered", current.delivered, previous.delivered),
    createComparison("Returned", current.returned, previous.returned),
    createComparison("Delivery Rate (%)", current.deliveryRate, previous.deliveryRate),
    createComparison("RTS Rate (%)", current.rtsRate, previous.rtsRate),
    createComparison("Gross Sales", current.grossSales, previous.grossSales),
    createComparison("Net Profit", current.netProfit, previous.netProfit),
  ]
}

// Generate predictive insights
export function generatePredictiveInsights(data: ProcessedData): PredictiveInsight[] {
  const insights: PredictiveInsight[] = []
  const allData = data.all

  // Calculate key metrics
  const total = allData.total
  const delivered = allData.data.filter(p => p.normalizedStatus === "DELIVERED").length
  const returned = allData.data.filter(p => p.normalizedStatus === "RETURNED").length
  const rtsRate = total > 0 ? (returned / total) * 100 : 0

  // High RTS rate warning
  if (rtsRate > 15) {
    insights.push({
      type: "warning",
      title: "High RTS Rate Detected",
      description: `Current RTS rate is ${rtsRate.toFixed(1)}%, which is above the 15% threshold.`,
      impact: "high",
      recommendation: "Investigate top RTS provinces and implement targeted interventions. Consider improving address verification and customer communication.",
    })
  }

  // Regional performance opportunity
  const regions = ["luzon", "visayas", "mindanao"] as const
  const regionalRTS = regions.map(region => {
    const regionData = data[region]
    const regionReturned = regionData.data.filter(p => p.normalizedStatus === "RETURNED").length
    const regionTotal = regionData.total
    return {
      region,
      rtsRate: regionTotal > 0 ? (regionReturned / regionTotal) * 100 : 0,
    }
  })

  const worstRegion = regionalRTS.reduce((worst, current) => 
    current.rtsRate > worst.rtsRate ? current : worst
  )

  if (worstRegion.rtsRate > 20) {
    insights.push({
      type: "opportunity",
      title: `${worstRegion.region.charAt(0).toUpperCase() + worstRegion.region.slice(1)} Needs Attention`,
      description: `${worstRegion.region} has an RTS rate of ${worstRegion.rtsRate.toFixed(1)}%, significantly higher than other regions.`,
      impact: "high",
      recommendation: `Focus on improving delivery success in ${worstRegion.region}. Consider partnering with local couriers or improving route optimization.`,
    })
  }

  // Financial impact insight
  const totalRTSFee = allData.data
    .filter(p => p.normalizedStatus === "RETURNED")
    .reduce((sum, p) => sum + (p.rtsFee || 0), 0)

  if (totalRTSFee > 50000) {
    insights.push({
      type: "warning",
      title: "Significant RTS Cost Impact",
      description: `RTS fees total ₱${totalRTSFee.toLocaleString()}, representing a significant cost burden.`,
      impact: "high",
      recommendation: "Reducing RTS rate by just 5% could save approximately ₱" + (totalRTSFee * 0.05).toLocaleString() + ". Prioritize RTS reduction initiatives.",
    })
  }

  // Data quality insight
  const unknownProvinces = allData.data.filter(p => p.province === "Unknown").length
  const unknownPercentage = total > 0 ? (unknownProvinces / total) * 100 : 0

  if (unknownPercentage > 5) {
    insights.push({
      type: "info",
      title: "Data Quality Issue Detected",
      description: `${unknownPercentage.toFixed(1)}% of parcels have unknown province information.`,
      impact: "medium",
      recommendation: "Improve data collection processes to ensure complete geographic information. This will enable better regional analysis.",
    })
  }

  // Positive performance insight
  const deliveryRate = total > 0 ? (delivered / total) * 100 : 0
  if (deliveryRate > 85) {
    insights.push({
      type: "opportunity",
      title: "Strong Delivery Performance",
      description: `Current delivery rate of ${deliveryRate.toFixed(1)}% exceeds industry standards.`,
      impact: "medium",
      recommendation: "Document and replicate successful practices across all regions. Consider case studies of top-performing areas.",
    })
  }

  return insights
}

// Calculate average delivery time (if date tracking is available)
export function calculateAverageDeliveryTime(): number | null {
  // This would require pickup date and delivery date fields
  // Placeholder for future implementation
  return null
}

// Identify bottlenecks in delivery pipeline
export function identifyBottlenecks(data: ProcessedData): {
  status: string
  count: number
  percentage: number
  avgDuration?: number
}[] {
  const allData = data.all
  const total = allData.total

  const bottlenecks = Object.entries(allData.stats)
    .map(([status, statusData]) => ({
      status,
      count: statusData.count,
      percentage: total > 0 ? (statusData.count / total) * 100 : 0,
    }))
    .filter(item => ["PICKUP", "INTRANSIT", "DETAINED", "PROBLEMATIC"].includes(item.status))
    .sort((a, b) => b.count - a.count)

  return bottlenecks
}
