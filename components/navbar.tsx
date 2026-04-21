"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Home, TrendingUp, PieChart, Menu, X, Sun, Moon, FileText, LogOut, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  currentView?: string
  onViewChange?: (view: string) => void
  userRole?: "admin" | "tracker" | null
}

export function Navbar({ currentView = "dashboard", onViewChange, userRole }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const allMenuItems = [
    { id: "dashboard", label: "Parcel", icon: Home },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "analytical", label: "Analytical", icon: PieChart },
    { id: "orders", label: "Orders", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  // Filter menu items based on role
  const menuItems = userRole === "tracker" 
    ? allMenuItems.filter(item => item.id === "orders")
    : allMenuItems

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

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
            {userRole !== "tracker" && menuItems.map((item) => {
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

          {/* Coverage Areas - Desktop (Admin only) */}
          {/* Removed - no longer needed */}

          {/* Right side controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* User Profile */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm">
                {userRole === "admin" ? "A" : "T"}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground leading-none">{userRole === "admin" ? "Admin" : "Tracker"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">User</p>
              </div>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-secondary/80 transition-colors"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
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
        {mobileMenuOpen && userRole !== "tracker" && (
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
            
            {/* Coverage Areas - Mobile (Removed) */}
          </div>
        )}
      </div>
    </nav>
  )
}
