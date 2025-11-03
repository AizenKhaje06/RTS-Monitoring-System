"use client"

import { BarChart3, Home, TrendingUp, PieChart, DollarSign } from "lucide-react"
import type { ReactNode } from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar"

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
    <SidebarProvider defaultOpen={true}>
      {hasData && (
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-3 p-2">
              <div className="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                <BarChart3 className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">RTS Monitor</h1>
                <p className="text-xs text-muted-foreground font-medium">Enterprise Analytics</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "dashboard"}
                  onClick={() => onViewChange?.("dashboard")}
                >
                  <Home className="w-5 h-5" />
                  <span>Parcel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "performance"}
                  onClick={() => onViewChange?.("performance")}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Performance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "analytical"}
                  onClick={() => onViewChange?.("analytical")}
                >
                  <PieChart className="w-5 h-5" />
                  <span>Store</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "financial"}
                  onClick={() => onViewChange?.("financial")}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Profit And Loss</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-4">
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
          </SidebarFooter>
        </Sidebar>
      )}
      <SidebarInset>
        <div className="flex h-screen bg-background overflow-hidden">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
