"use client"

import React from "react"
import { MapVisualization } from "./map-visualization"

interface RTSHotspotMapProps {
  data: { region: string; value: number }[]
}

export function RTSHotspotMap({ data }: RTSHotspotMapProps) {
  // Reuse MapVisualization with specific color range for RTS hotspot
  return (
    <div className="glass rounded-xl p-6 border border-border/50 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">RTS Hotspot Map</h2>
      <MapVisualization data={data} colorRange={["#ffcccc", "#cc0000"]} />
    </div>
  )
}
