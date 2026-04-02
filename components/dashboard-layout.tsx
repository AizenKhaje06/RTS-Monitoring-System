"use client"

import type { ReactNode } from "react"
import { Navbar } from "@/components/navbar"

interface DashboardLayoutProps {
  children: ReactNode
  hasData: boolean
  currentView?: string
  onViewChange?: (view: string) => void
}

export function DashboardLayout({
  children,
  hasData,
  currentView = "dashboard",
  onViewChange,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {hasData && <Navbar currentView={currentView} onViewChange={onViewChange} />}
      <main className="w-full">
        {children}
      </main>
    </div>
  )
}
