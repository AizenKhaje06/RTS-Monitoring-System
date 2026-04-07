"use client"

import { useMemo } from "react"
import { TrendingUp } from "lucide-react"

interface StatusCardSimpleProps {
  status: string
  count: number
  locations: { [province: string]: number }
  colorClass: string
  total: number
}

export function StatusCardSimple({ status, count, locations, colorClass, total }: StatusCardSimpleProps) {
  const topLocations = useMemo(() => {
    return Object.entries(locations)
      .filter(([location]) => location && location !== "unknown location" && location !== "Unknown" && location.trim() !== "")
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }))
  }, [locations])

  const percentage = useMemo(() => {
    if (total === 0) return '0%'
    const pct = (count / total) * 100
    return `${pct.toFixed(2)}%`
  }, [count, total])

  return (
    <div className="glass-strong rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all group">
      <div className={`p-5 relative overflow-hidden ${colorClass}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">{status}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">{count.toLocaleString()}</span>
              <TrendingUp className="w-4 h-4 text-white/60" />
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2 py-1 text-xs font-medium text-white bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-white/20 ${colorClass.replace('from-', 'bg-gradient-to-r from-').replace('to-', ' to-')} min-w-[3rem] text-center`}>
              {percentage}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h6 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1 h-4 gradient-orange rounded-full" />
          Top Provinces
        </h6>
        {topLocations.length > 0 ? (
          <div className="space-y-2">
            {topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                <span className="text-sm font-medium">{location.location}</span>
                <span className="text-sm text-muted-foreground">{location.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
