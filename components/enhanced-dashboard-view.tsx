"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardView } from "@/components/dashboard-view"
import { TrendChart } from "@/components/trend-chart"
import { ComparisonView } from "@/components/comparison-view"
import { PredictiveInsights } from "@/components/predictive-insights"
import { DataQualityDashboard } from "@/components/data-quality-dashboard"
import { ExportMenu } from "@/components/export-menu"
import type { ProcessedData, FilterState } from "@/lib/types"

interface EnhancedDashboardViewProps {
  data: ProcessedData | null
  filter: FilterState
  onFilterChange: (filter: FilterState) => void
}

export function EnhancedDashboardView({ data, filter, onFilterChange }: EnhancedDashboardViewProps) {
  const [currentRegion, setCurrentRegion] = useState<"all" | "luzon" | "visayas" | "mindanao">("all")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <ExportMenu data={data} region={currentRegion} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {data && (
            <DashboardView
              data={data}
              currentRegion={currentRegion}
              onRegionChange={setCurrentRegion}
              filter={filter}
              onFilterChange={onFilterChange}
            />
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendChart data={data} region={currentRegion} />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <ComparisonView data={data} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <PredictiveInsights data={data} />
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <DataQualityDashboard data={data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
