"use client"

import React from "react"
import { HeatMapGrid } from "react-grid-heatmap"

interface PickupTimeHeatmapProps {
  data: number[][]
  xLabels: string[]
  yLabels: string[]
}

export function PickupTimeHeatmap({ data, xLabels, yLabels }: PickupTimeHeatmapProps) {
  return (
    <div className="glass rounded-xl p-6 border border-border/50 mb-6 overflow-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Pick-up Time Heatmap</h2>
      <HeatMapGrid
        data={data}
        xLabels={xLabels}
        yLabels={yLabels}
        cellHeight="2rem"
        xLabelsStyle={() => ({
          color: "#777",
          fontSize: "0.75rem",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        })}
        yLabelsStyle={() => ({
          color: "#777",
          fontSize: "0.75rem",
        })}
        cellStyle={(x: number, y: number, ratio: number) => ({
          background: `rgba(136, 132, 216, ${ratio})`,
          fontSize: "0.75rem",
          color: ratio > 0.5 ? "#fff" : "#000",
        })}
        cellRender={(value) => value && <div>{value}</div>}
      />
    </div>
  )
}
