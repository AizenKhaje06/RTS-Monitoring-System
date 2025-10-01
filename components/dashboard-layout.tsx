"use client"

import { BarChart3, Upload, Home, TrendingUp, ChevronLeft, ChevronRight, PieChart, DollarSign } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
  children: ReactNode
  onUploadClick: () => void
  hasData: boolean
  currentView?: string
  onViewChange?: (view: string) => void
}

export function DashboardLayout({
  children,
  onUploadClick,
  hasData,
  currentView = "dashboard",
  onViewChange,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {hasData && (
        <aside
          className={`${
            isCollapsed ? "w-20" : "w-72"
          } glass-strong flex flex-col border-r border-border/50 relative transition-all duration-300`}
        >
          {/* Subtle orange glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full glass-strong border border-border/50 hover:border-primary/50 transition-all"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            )}
          </Button>

          <div className="relative p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                <BarChart3 className="w-7 h-7 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">RTS Monitor</h1>
                  <p className="text-xs text-muted-foreground font-medium">Enterprise Analytics</p>
                </div>
              )}
            </div>
          </div>

          <nav className="relative flex-1 p-4 space-y-2">
            <button
              onClick={() => onViewChange?.("dashboard")}
              className={`w-full flex items-center gap-3 ${
                isCollapsed ? "justify-center px-0" : "px-4"
              } py-3 rounded-xl ${
                currentView === "dashboard"
                  ? "gradient-orange text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              } transition-all font-medium`}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span>Dashboard</span>
                  {currentView === "dashboard" && <TrendingUp className="w-4 h-4 ml-auto" />}
                </>
              )}
            </button>
            <button
              onClick={onUploadClick}
              className={`w-full flex items-center gap-3 ${
                isCollapsed ? "justify-center px-0" : "px-4"
              } py-3 rounded-xl text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all font-medium`}
            >
              <Upload className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Upload Data</span>}
            </button>

            <button
              onClick={() => onViewChange?.("performance")}
              className={`w-full flex items-center gap-3 ${
                isCollapsed ? "justify-center px-0" : "px-4"
              } py-3 rounded-xl ${
                currentView === "performance"
                  ? "gradient-orange text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              } transition-all font-medium`}
            >
              <TrendingUp className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Performance Report</span>}
            </button>

            <button
              onClick={() => onViewChange?.("analytical")}
              className={`w-full flex items-center gap-3 ${
                isCollapsed ? "justify-center px-0" : "px-4"
              } py-3 rounded-xl ${
                currentView === "analytical"
                  ? "gradient-orange text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              } transition-all font-medium`}
            >
              <PieChart className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Analytical Report</span>}
            </button>

            <button
              onClick={() => onViewChange?.("financial")}
              className={`w-full flex items-center gap-3 ${
                isCollapsed ? "justify-center px-0" : "px-4"
              } py-3 rounded-xl ${
                currentView === "financial"
                  ? "gradient-orange text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              } transition-all font-medium`}
            >
              <DollarSign className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Financial Impact Report</span>}
            </button>
          </nav>

          {!isCollapsed && (
            <div className="relative p-6 border-t border-border/50">
              <div className="glass rounded-lg p-4">
                <p className="text-xs font-semibold text-primary mb-2">COVERAGE AREAS</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center justify-between">
                    <span>Luzon</span>
                    <span className="text-foreground font-medium">Active</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Visayas</span>
                    <span className="text-foreground font-medium">Active</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Mindanao</span>
                    <span className="text-foreground font-medium">Active</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
