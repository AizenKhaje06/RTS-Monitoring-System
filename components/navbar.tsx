"use client"

import { useState } from "react"
import { BarChart3, Home, TrendingUp, PieChart, Menu, X, Sun, Moon, FileText } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  currentView?: string
  onViewChange?: (view: string) => void
}

export function Navbar({ currentView = "dashboard", onViewChange }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const menuItems = [
    { id: "dashboard", label: "Parcel", icon: Home },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "analytical", label: "Analytical", icon: PieChart },
    { id: "orders", label: "Orders", icon: FileText },
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
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onViewChange?.(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 transition-all relative ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                      : "hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground rounded-t-full"></span>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Coverage Areas - Desktop */}
          <div className="hidden lg:flex items-center gap-4 text-sm">
            <span className="text-muted-foreground font-bold tracking-wide">COVERAGE:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                Luzon
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                Visayas
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                Mindanao
              </span>
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 hover:bg-secondary/80"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme Toggle - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
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
                    className={`flex items-center gap-3 justify-start w-full py-3 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-secondary/80"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                )
              })}
            </div>
            
            {/* Coverage Areas - Mobile */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-sm font-bold text-muted-foreground mb-3 tracking-wide">COVERAGE AREAS</p>
              <div className="flex flex-col gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  Luzon - Active
                </span>
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  Visayas - Active
                </span>
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
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
