"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface PredictiveRiskBarChartProps {
  data: { province: string; returnProbability: number }[]
  title?: string
}

export function PredictiveRiskBarChart({ data, title = "Region Province With high RTS" }: PredictiveRiskBarChartProps) {
  return (
    <div style={{ backgroundColor: "#1a1a3d", borderRadius: 8, padding: 20, maxWidth: 700, margin: "auto", color: "#fff" }}>
      <h3 style={{ textAlign: "center", marginBottom: 20, fontWeight: "bold", fontSize: 18 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis dataKey="province" stroke="#a0a0a0" />
          <YAxis stroke="#a0a0a0" />
          <Tooltip
            contentStyle={{ backgroundColor: "#222", borderRadius: 8, borderColor: "#444" }}
            itemStyle={{ color: "#fff" }}
            cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
          />
          <Bar
            dataKey="returnProbability"
            fill="url(#colorUv)"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
          />
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ffcc" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#006666" stopOpacity={0} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
