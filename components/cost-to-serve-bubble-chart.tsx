"use client"

import React from "react"
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface CostToServeBubbleChartProps {
  data: { client: string; cost: number; volume: number }[]
}

export function CostToServeBubbleChart({ data }: CostToServeBubbleChartProps) {
  return (
    <div className="glass rounded-xl p-6 border border-border/50 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Cost-to-Serve Bubble Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="cost" name="Cost" unit="$" />
          <YAxis type="number" dataKey="volume" name="Volume" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Clients" data={data} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
