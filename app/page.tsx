"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { AuthProvider } from "@/components/session-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"
import { PerformanceReport } from "@/components/performance-report"
import { AnalyticalReport } from "@/components/analytical-report"
import { FinancialReport } from "@/components/financial-report"
import type { ProcessedData, FilterState } from "@/lib/types"

export default function Home() {
  const [data, setData] = useState<ProcessedData | null>(null)
  const [currentView, setCurrentView] = useState<string>("dashboard")
  const [globalFilter, setGlobalFilter] = useState<FilterState>({ type: "all", value: "" })

  const handleEnterDashboard = async () => {
    try {
      const response = await fetch("/api/google-sheets/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error("Failed to process data")

      const processedData = await response.json()
      setData(processedData)
      setCurrentView("dashboard")
    } catch (error) {
      console.error("Error processing Google Sheets data:", error)
      alert("Failed to process data from Google Sheets. Please check your configuration.")
    }
  }

  const renderView = () => {
    switch (currentView) {
      case "performance":
        return <PerformanceReport data={data} filter={globalFilter} onFilterChange={setGlobalFilter} />
      case "analytical":
        return <AnalyticalReport data={data} filter={globalFilter} onFilterChange={setGlobalFilter} />
      case "financial":
        return <FinancialReport data={data} filter={globalFilter} onFilterChange={setGlobalFilter} />
      default:
        return <DashboardContent data={data} onUploadClick={handleEnterDashboard} filter={globalFilter} onFilterChange={setGlobalFilter} />
    }
  }

  return (
    <AuthProvider>
      <DashboardLayout
        hasData={!!data}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        {renderView()}
      </DashboardLayout>
    </AuthProvider>
  )
}
