"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic"
import type { RegionData } from "@/lib/types"

import "leaflet/dist/leaflet.css"

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })

interface PhilippinesMapProps {
  data: {
    luzon: RegionData
    visayas: RegionData
    mindanao: RegionData
  }
}

export function PhilippinesMap({ data }: PhilippinesMapProps) {
  const geoJsonData = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Luzon",
          region: "luzon",
          total: data.luzon.total,
          rtsPercentage: data.luzon.total > 0 ? ((data.luzon.stats.CANCELLED?.count || 0) + (data.luzon.stats.PROBLEMATIC?.count || 0) + (data.luzon.stats.RETURNED?.count || 0)) / data.luzon.total * 100 : 0
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [119.0, 18.0],
            [122.0, 18.0],
            [122.0, 16.0],
            [125.0, 16.0],
            [125.0, 14.0],
            [119.0, 14.0],
            [119.0, 18.0]
          ]]
        }
      },
      {
        type: "Feature",
        properties: {
          name: "Visayas",
          region: "visayas",
          total: data.visayas.total,
          rtsPercentage: data.visayas.total > 0 ? ((data.visayas.stats.CANCELLED?.count || 0) + (data.visayas.stats.PROBLEMATIC?.count || 0) + (data.visayas.stats.RETURNED?.count || 0)) / data.visayas.total * 100 : 0
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [122.0, 12.0],
            [125.0, 12.0],
            [125.0, 9.0],
            [122.0, 9.0],
            [122.0, 12.0]
          ]]
        }
      },
      {
        type: "Feature",
        properties: {
          name: "Mindanao",
          region: "mindanao",
          total: data.mindanao.total,
          rtsPercentage: data.mindanao.total > 0 ? ((data.mindanao.stats.CANCELLED?.count || 0) + (data.mindanao.stats.PROBLEMATIC?.count || 0) + (data.mindanao.stats.RETURNED?.count || 0)) / data.mindanao.total * 100 : 0
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [118.0, 9.0],
            [127.0, 9.0],
            [127.0, 4.0],
            [118.0, 4.0],
            [118.0, 9.0]
          ]]
        }
      }
    ]
  }

  const getColor = (rtsPercentage: number) => {
    return rtsPercentage > 10 ? '#800026' :
           rtsPercentage > 8  ? '#BD0026' :
           rtsPercentage > 6  ? '#E31A1C' :
           rtsPercentage > 4  ? '#FC4E2A' :
           rtsPercentage > 2  ? '#FD8D3C' :
           rtsPercentage > 0  ? '#FEB24C' :
                                 '#FFEDA0';
  }

  const style = (feature: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      fillColor: getColor((feature as any).properties.rtsPercentage),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    }
  }

  const onEachFeature = (feature: unknown, layer: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (layer as any).bindTooltip(`<div>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <strong>${(feature as any).properties.name}</strong><br/>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Total Parcels: ${(feature as any).properties.total}<br/>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      RTS: ${(feature as any).properties.rtsPercentage.toFixed(2)}%
    </div>`, { permanent: false, sticky: true })
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <MapContainer
        center={[12.8797, 121.7740] as any}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <GeoJSON
          data={geoJsonData as any}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  )
}
