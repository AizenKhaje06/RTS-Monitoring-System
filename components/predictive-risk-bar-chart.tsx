"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, ReferenceLine, Tooltip } from "recharts"

interface PredictiveRiskBarChartProps {
  data: { province: string; returnProbability: number }[]
  threshold?: number
  title?: string
}

export function PredictiveRiskBarChart({ data, threshold = 70, title = "Region Province With high RTS" }: PredictiveRiskBarChartProps) {
  return (
    <div style={{ backgroundColor: "#1a1a1a", borderRadius: 8, padding: 20, maxWidth: 700, margin: "auto" }}>
      <h3 style={{ textAlign: "center", marginBottom: 20, fontWeight: "bold", fontSize: 18, color: "#ffffff" }}>{title}</h3>
      <BarChart
        width={700}
        height={350}
        data={data}
        layout="horizontal"
        margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
        barCategoryGap="30%"
        barGap={0}
      >
        <CartesianGrid stroke="#555" strokeDasharray="3 3" vertical={false} />
        <XAxis
          type="number"
          unit="%"
          stroke="#cccccc"
          domain={[0, 100]}
          tick={{ fill: "#ffffff", fontSize: 14 }}
          tickLine={false}
          axisLine={true}
        />
        <YAxis
          dataKey="province"
          type="category"
          width={150}
          stroke="#cccccc"
          tick={{ fill: "#ffffff", fontSize: 14 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip />
        {/* Background track bar */}
        <Bar
          dataKey={() => 100}
          fill="#333333"
          barSize={30}
          radius={[10, 10, 10, 10]}
          isAnimationActive={false}
        />
        {/* Actual value bar */}
        <Bar
          dataKey="returnProbability"
          fill="#000000"
          barSize={30}
          radius={[10, 10, 10, 10]}
          stroke="#ffffff"
          strokeWidth={1}
        >
          <LabelList
            dataKey="returnProbability"
            position="insideLeft"
            formatter={(label: any) => (typeof label === "number" ? `${label.toFixed(1)}%` : "")}
            fill="#ffffff"
            offset={10}
          />
        </Bar>
        {/* Threshold line */}
        <ReferenceLine x={threshold} stroke="#ffffff" strokeWidth={2} />
      </BarChart>
    </div>
  )
}
