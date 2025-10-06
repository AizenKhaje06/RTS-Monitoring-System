"use client"

import React from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { scaleLinear } from "d3-scale"

interface MapVisualizationProps {
  data: { region: string; value: number }[]
  colorRange?: [string, string]
}

const geoUrl =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/us-states/US-States.json"

export function MapVisualization({ data, colorRange = ["#ffeda0", "#f03b20"] }: MapVisualizationProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  const colorScale = scaleLinear<string>()
    .domain([0, maxValue])
    .range(colorRange)

  const dataMap = new Map(data.map(d => [d.region.toLowerCase(), d.value]))

  return (
    <ComposableMap projection="geoAlbersUsa" width={600} height={400}>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map(geo => {
            const cur = dataMap.get(geo.properties.name.toLowerCase())
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={cur ? colorScale(cur) : "#EEE"}
                stroke="#FFF"
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#f53", outline: "none" },
                  pressed: { outline: "none" }
                }}
              />
            )
          })
        }
      </Geographies>
    </ComposableMap>
  )
}
