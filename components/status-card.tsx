"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, CheckCircle2, Truck, Clock, XCircle, AlertTriangle, Package, RotateCcw, PackageCheck, HelpCircle } from "lucide-react"

interface StatusCardProps {
  status: string
  count: number
  locations: { [province: string]: number }
  colorClass: string
  total: number
}

// Status icon mapping
const STATUS_ICONS = {
  "DELIVERED": CheckCircle2,
  "ONDELIVERY": Truck,
  "PENDING": Clock,
  "INTRANSIT": Package,
  "CANCELLED": XCircle,
  "DETAINED": AlertTriangle,
  "PROBLEMATIC": AlertTriangle,
  "RETURNED": RotateCcw,
  "PENDING FULFILLED": PackageCheck,
  "OTHER": HelpCircle,
}

export function StatusCard({ status, count, locations, colorClass, total }: StatusCardProps) {
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

  const barColors = [
    "oklch(0.65 0.19 45)",
    "oklch(0.68 0.17 50)",
    "oklch(0.72 0.18 55)",
    "oklch(0.75 0.15 60)",
    "oklch(0.78 0.13 65)",
  ]

  const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || HelpCircle

  return (
    <div className="glass-strong rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all group">
      <div className={`p-5 relative overflow-hidden ${colorClass}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className="w-4 h-4 text-gray-900 dark:text-white" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{status}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{count.toLocaleString()}</span>
              <TrendingUp className="w-4 h-4 text-gray-700 dark:text-white/80" />
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-orange-500 dark:bg-black/20 backdrop-blur-sm rounded-full shadow-lg border border-orange-600 dark:border-white/30 min-w-[3rem] text-center">
              {percentage}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h6 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "0.75rem",
                        color: "white",
                        backdropFilter: "blur(12px)",
                        padding: "8px",
                        fontSize: "12px"
                      }}>
                        <p style={{ margin: 0, fontWeight: 'bold', color: 'white' }}>{label}</p>
                        <p style={{ margin: 0, color: 'white' }}>{`Count: ${payload[0].value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
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
