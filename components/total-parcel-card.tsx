"use client"

import { Package, TrendingUp } from "lucide-react"

interface TotalParcelCardProps {
  total: number
}

export function TotalParcelCard({ total }: TotalParcelCardProps) {
  const percentage = "100%"

  return (
    <div className="glass-strong rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all group col-span-full">
      <div className="p-5 relative overflow-hidden bg-gradient-to-br from-primary to-primary/80">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">Total Parcel</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-white">{total.toLocaleString()}</span>
                <TrendingUp className="w-5 h-5 text-white/60" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1.5 text-sm font-medium text-white bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-white/20 min-w-[4rem] text-center">
              {percentage}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted-foreground">
          Total parcels across all regions
        </p>
      </div>
    </div>
  )
}
