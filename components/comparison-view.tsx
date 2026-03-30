"use client"

import { useState, useMemo } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProcessedData } from "@/lib/types"
import { compareTimePeriods } from "@/lib/analytics"

interface ComparisonViewProps {
  data: ProcessedData | null
}

export function ComparisonView({ data }: ComparisonViewProps) {
  const [selectedMonth1, setSelectedMonth1] = useState<string>("")
  const [selectedMonth2, setSelectedMonth2] = useState<string>("")

  const availableMonths = useMemo(() => {
    if (!data) return []
    
    const months = new Set<string>()
    data.all.data.forEach(parcel => {
      if (parcel.month) months.add(parcel.month)
    })
    
    return Array.from(months).sort()
  }, [data])

  const comparisonData = useMemo(() => {
    if (!data || !selectedMonth1 || !selectedMonth2) return null

    const period1Parcels = data.all.data.filter(p => p.month === selectedMonth1)
    const period2Parcels = data.all.data.filter(p => p.month === selectedMonth2)

    return compareTimePeriods(period1Parcels, period2Parcels)
  }, [data, selectedMonth1, selectedMonth2])

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Period Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = (metric: string, trend: "up" | "down" | "stable") => {
    // For RTS Rate, down is good
    if (metric.includes("RTS")) {
      return trend === "down" ? "text-green-600" : trend === "up" ? "text-red-600" : "text-gray-600"
    }
    // For most other metrics, up is good
    return trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Period Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Period 1</label>
            <select
              value={selectedMonth1}
              onChange={(e) => setSelectedMonth1(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-md"
            >
              <option value="">Select period...</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Period 2</label>
            <select
              value={selectedMonth2}
              onChange={(e) => setSelectedMonth2(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-md"
            >
              <option value="">Select period...</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {comparisonData ? (
          <div className="space-y-3">
            {comparisonData.map((item) => (
              <div
                key={item.metric}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  {getTrendIcon(item.trend)}
                  <span className="font-medium">{item.metric}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {item.previous.toLocaleString()} → {item.current.toLocaleString()}
                    </div>
                    <div className={`text-sm font-bold ${getTrendColor(item.metric, item.trend)}`}>
                      {item.change > 0 ? "+" : ""}{item.changePercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Select two periods to compare
          </p>
        )}
      </CardContent>
    </Card>
  )
}
