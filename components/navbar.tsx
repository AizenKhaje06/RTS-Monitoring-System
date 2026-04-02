"use client"

import { useState } from "react"
import { BarChart3, Home, TrendingUp, PieChart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  currentView?: string
  onViewChange?: (view: string) => void
}

export function Navbar({ currentView = "dashboard", onViewChange }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { id: "dashboard", label: "Parcel", icon: Home },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "analytical", label: "Store", icon: PieChart },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-primary/20">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">RTS Monitor</h1>
              <p className="text-xs text-muted-foreground font-medium hidden sm:block">Enterprise Analytics</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onViewChange?.(item.id)}
                  className={`flex items-center gap-2 transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </div>

          {/* Coverage Areas - Desktop */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <span className="text-muted-foreground font-semibold">COVERAGE:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Luzon
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Visayas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Mindanao
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => {
                      onViewChange?.(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-2 justify-start w-full ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                )
              })}
            </div>
            
            {/* Coverage Areas - Mobile */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground mb-2">COVERAGE AREAS</p>
              <div className="flex flex-col gap-2 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Luzon - Active
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Visayas - Active
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Mindanao - Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
