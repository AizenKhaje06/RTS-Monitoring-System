"use client"

import { useState } from "react"
import { DashboardView } from "@/components/dashboard-view"
import type { ProcessedData, FilterState } from "@/lib/types"
import { BarChart3, TrendingUp, Package, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardContentProps {
  data: ProcessedData | null
  onDataChange: (data: ProcessedData) => void
  onUploadClick: () => void
}

export function DashboardContent({ data, onDataChange, onUploadClick }: DashboardContentProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")
  const [filter, setFilter] = useState<FilterState>({ type: "all", value: "" })

  return (
    <div className="p-8 space-y-8 min-h-screen flex flex-col">
      <div className="relative text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-4xl font-bold text-foreground tracking-tight mb-3 uppercase">RTS Monitoring Dashboard</h2>
          <p className="text-muted-foreground text-lg">
            Enterprise-grade parcel tracking and analytics across Philippine regions
          </p>
        </div>
      </div>

      {data && (
        <DashboardView
          data={data}
          currentRegion={currentRegion}
          onRegionChange={setCurrentRegion}
          filter={filter}
          onFilterChange={setFilter}
        />
      )}

      {!data && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-strong rounded-2xl p-12 text-center max-w-2xl mx-auto border border-border/50">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 gradient-orange rounded-2xl opacity-20 blur-xl" />
                <div className="relative glass-strong rounded-2xl w-full h-full flex items-center justify-center border border-primary/30">
                  <Package className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Ready to Track Parcels</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Upload your Excel data file to begin comprehensive analytics and monitoring
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Real-time Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span>Regional Insights</span>
                </div>
              </div>
              <Button
                onClick={onUploadClick}
                size="lg"
                className="gradient-orange text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 px-8"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload & Process
              </Button>
            </div>
          </div>

          <div className="mt-auto pt-12 pb-6 text-center">
            <p className="text-muted-foreground text-sm max-w-3xl mx-auto leading-relaxed">
              Powered by advanced analytics and real-time data processing, the RTS Monitoring Dashboard delivers
              enterprise-level insights for optimized logistics operations across the Philippine archipelago. Streamline
              your parcel tracking workflow with intelligent regional analytics and comprehensive performance metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
