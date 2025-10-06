"use client"

import React from "react"
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface ClientPerformanceMatrixProps {
  data: { client: string; performance: number; rtsRate: number }[]
}

export function ClientPerformanceMatrix({ data }: ClientPerformanceMatrixProps) {
  return (
    <div className="glass rounded-xl p-6 border border-border/50 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Client Performance Matrix</h2>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="performance" name="Performance" />
          <YAxis type="number" dataKey="rtsRate" name="RTS Rate" unit="%" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Clients" data={data} fill="#82ca9d" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
