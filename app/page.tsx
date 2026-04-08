"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { AuthProvider } from "@/components/session-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"
import { PerformanceReport } from "@/components/performance-report"
import { AnalyticalReport } from "@/components/analytical-report"
import { FinancialReport } from "@/components/financial-report"
import { OrdersTableView } from "@/components/orders-table-view"
import { ErrorBoundary } from "@/components/error-boundary"
import { FullPageLoading } from "@/components/loading-state"
import type { ProcessedData, FilterState } from "@/lib/types"

export default function Home() {
  const [data, setData] = useState<ProcessedData | null>(null)
  const [currentView, setCurrentView] = useState<string>("dashboard")
  const [globalFilter, setGlobalFilter] = useState<FilterState>({ type: "all", value: "" })
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async (filter: FilterState = { type: "all", value: "" }) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/supabase/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ forceRefresh: false, filter }),
      })

      if (!response.ok) throw new Error("Failed to process data")

      const processedData = await response.json()
      setData(processedData)
      
      if (processedData.fromCache) {
        console.log("📦 Data loaded from cache")
      } else {
        console.log("✅ Data loaded from Supabase")
      }
    } catch (error) {
      console.error("❌ Error fetching data from Supabase:", error)
      alert("Failed to fetch data from Supabase. Please check your configuration and ensure you have added NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnterDashboard = async () => {
    await fetchData(globalFilter)
    setCurrentView("dashboard")
  }

  const handleFilterChange = async (newFilter: FilterState) => {
    setGlobalFilter(newFilter)
    await fetchData(newFilter)
  }

  const renderView = () => {
    switch (currentView) {
      case "orders":
        return (
          <div className="p-8">
            <OrdersTableView data={data} onDataChange={() => fetchData(globalFilter)} />
          </div>
        )
      case "performance":
        return <PerformanceReport data={data} filter={globalFilter} onFilterChange={handleFilterChange} />
      case "analytical":
        return <AnalyticalReport data={data} filter={globalFilter} onFilterChange={handleFilterChange} />
      case "financial":
        return <FinancialReport data={data} filter={globalFilter} onFilterChange={handleFilterChange} />
      default:
        return (
          <DashboardContent 
            data={data} 
            onUploadClick={handleEnterDashboard} 
            filter={globalFilter} 
            onFilterChange={handleFilterChange}
          />
        )
    }
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        {isLoading && <FullPageLoading message="Loading data from Supabase..." />}
        <DashboardLayout
          hasData={!!data}
          currentView={currentView}
          onViewChange={setCurrentView}
        >
          {renderView()}
        </DashboardLayout>
      </AuthProvider>
    </ErrorBoundary>
  )
}
