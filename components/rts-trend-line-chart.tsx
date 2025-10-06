"use client"

import React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RTSTrendLineChartProps {
  data: { date: string; rtsRate: number }[]
}

export function RTSTrendLineChart({ data }: RTSTrendLineChartProps) {
  return (
    <div className="glass rounded-xl p-6 border border-border/50 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">RTS Trend Line Chart with Forecast</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="rtsRate" stroke="#8884d8" activeDot={{ r: 8 }} />
          {/* Add forecast line if needed */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
