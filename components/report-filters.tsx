"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ReportFilters {
  island: "all" | "luzon" | "visayas" | "mindanao"
  status: string
  dateFrom: string
  dateTo: string
}

interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  availableStatuses: string[]
}

export function ReportFiltersComponent({ filters, onFiltersChange, availableStatuses }: ReportFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleReset = () => {
    onFiltersChange({
      island: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
    })
  }

  const hasActiveFilters = filters.island !== "all" || filters.status !== "all" || filters.dateFrom || filters.dateTo

  return (
    <div className="glass rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              Active
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isOpen ? "Hide" : "Show"}
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Island</label>
              <select
                value={filters.island}
                onChange={(e) => onFiltersChange({ ...filters, island: e.target.value as ReportFilters["island"] })}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Islands</option>
                <option value="luzon">Luzon</option>
                <option value="visayas">Visayas</option>
                <option value="mindanao">Mindanao</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button onClick={handleReset} variant="outline" size="sm" className="gap-2 bg-transparent">
              <X className="w-4 h-4" />
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
