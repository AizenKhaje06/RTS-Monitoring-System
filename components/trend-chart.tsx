"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TrendChartProps {
  data: { analytics?: { trends: { all: unknown[], luzon: unknown[], visayas: unknown[], mindanao: unknown[] } } } | null
  region?: "all" | "luzon" | "visayas" | "mindanao"
}

export function TrendChart({ data, region = "all" }: TrendChartProps) {
  const trendData = data?.analytics?.trends?.[region] || []

  if (!data || !trendData || trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No trend data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Trends Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="delivered"
              stroke="#10b981"
              strokeWidth={2}
              name="Delivered"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="returned"
              stroke="#ef4444"
              strokeWidth={2}
              name="Returned"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="deliveryRate"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Delivery Rate (%)"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
