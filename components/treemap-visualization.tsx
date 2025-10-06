"use client"

import React from "react"
import { Treemap, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface TreemapVisualizationProps {
  data: { name: string; value: number }[]
  width?: number
  height?: number
  colorRange?: [string, string]
}

export function TreemapVisualization({
  data,
  width = 600,
  height = 400,
  colorRange = ["#ffeda0", "#f03b20"]
}: TreemapVisualizationProps) {
  // Calculate max and min values for color scaling
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))

  // Function to interpolate color based on value
  const interpolateColor = (value: number) => {
    if (maxValue === minValue) {
      return colorRange[0]
    }
    const ratio = (value - minValue) / (maxValue - minValue)
    const startColor = colorRange[0]
      .substring(1)
      .match(/.{2}/g)
      ?.map((c) => parseInt(c, 16)) || [255, 237, 160]
    const endColor = colorRange[1]
      .substring(1)
      .match(/.{2}/g)
      ?.map((c) => parseInt(c, 16)) || [240, 59, 32]
    const r = Math.round(startColor[0] + ratio * (endColor[0] - startColor[0]))
    const g = Math.round(startColor[1] + ratio * (endColor[1] - startColor[1]))
    const b = Math.round(startColor[2] + ratio * (endColor[2] - startColor[2]))
    return `rgb(${r},${g},${b})`
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <Treemap
        width={width}
        height={height}
        data={data}
        dataKey="value"
        stroke="#fff"
        fill="#8884d8"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={interpolateColor(entry.value)} />
        ))}
        <Tooltip />
      </Treemap>
    </ResponsiveContainer>
  )
}
