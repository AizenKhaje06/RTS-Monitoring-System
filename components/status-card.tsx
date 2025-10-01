"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp } from "lucide-react"

interface StatusCardProps {
  status: string
  count: number
  locations: { [province: string]: number }
  colorClass: string
}

export function StatusCard({ status, count, locations, colorClass }: StatusCardProps) {
  const topLocations = useMemo(() => {
    return Object.entries(locations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }))
  }, [locations])

  const barColors = [
    "oklch(0.65 0.19 45)",
    "oklch(0.68 0.17 50)",
    "oklch(0.72 0.18 55)",
    "oklch(0.75 0.15 60)",
    "oklch(0.78 0.13 65)",
  ]

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
        </div>
      </div>

      <div className="p-5">
        <h6 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1 h-4 gradient-orange rounded-full" />
          Top Provinces
        </h6>
        {topLocations.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topLocations} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
              <XAxis
                dataKey="location"
                tick={{ fontSize: 11, fill: "oklch(0.65 0.01 0)" }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="oklch(0.25 0.01 0 / 0.3)"
              />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.01 0)" }} stroke="oklch(0.25 0.01 0 / 0.3)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.12 0.01 0 / 0.95)",
                  border: "1px solid oklch(0.25 0.01 0 / 0.5)",
                  borderRadius: "0.75rem",
                  color: "oklch(0.98 0 0)",
                  backdropFilter: "blur(12px)",
                }}
                labelStyle={{ color: "oklch(0.65 0.19 45)" }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {topLocations.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
