"use client"

import React from "react"

interface PredictiveRiskBarChartProps {
  data: { province: string; returnProbability: number }[]
  title?: string
}

const getColorForValue = (value: number) => {
  // Map returnProbability (0-100) to a color gradient from dark gray to bright red
  const red = Math.min(255, Math.floor((value / 100) * 255))
  const green = 0
  const blue = 0
  return `rgb(${red},${green},${blue})`
}

export function PredictiveRiskBarChart({ data, title = "Region Province With high RTS" }: PredictiveRiskBarChartProps) {
  return (
    <div style={{ backgroundColor: "#1a1a1a", borderRadius: 8, padding: 20, maxWidth: 700, margin: "auto", color: "#fff" }}>
      <h3 style={{ textAlign: "center", marginBottom: 20, fontWeight: "bold", fontSize: 18 }}>{title}</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 10,
          justifyItems: "center",
        }}
      >
        {data.map(({ province, returnProbability }) => (
          <div
            key={province}
            title={`${province}: ${returnProbability.toFixed(1)}%`}
            style={{
              width: 80,
              height: 80,
              backgroundColor: getColorForValue(returnProbability),
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 0 8px rgba(255, 0, 0, 0.7)",
              cursor: "default",
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: 14, color: "#fff", textAlign: "center" }}>{province}</span>
            <span style={{ fontSize: 12, color: "#fff", marginTop: 4 }}>{returnProbability.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
