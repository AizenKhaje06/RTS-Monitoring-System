"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"
import { PerformanceReport } from "@/components/performance-report"
import { AnalyticalReport } from "@/components/analytical-report"
import { FinancialReport } from "@/components/financial-report"
import { UploadModal } from "@/components/upload-modal"
import type { ProcessedData } from "@/lib/types"

export default function Home() {
  const [data, setData] = useState<ProcessedData | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<string>("dashboard")

  const renderView = () => {
    switch (currentView) {
      case "performance":
        return <PerformanceReport data={data} />
      case "analytical":
        return <AnalyticalReport data={data} />
      case "financial":
        return <FinancialReport data={data} />
      default:
        return <DashboardContent data={data} onDataChange={setData} onUploadClick={() => setIsUploadModalOpen(true)} />
    }
  }

  return (
    <>
      <DashboardLayout
        onUploadClick={() => setIsUploadModalOpen(true)}
        hasData={!!data}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        {renderView()}
      </DashboardLayout>

      <UploadModal open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} onDataUpload={setData} />
    </>
  )
}
