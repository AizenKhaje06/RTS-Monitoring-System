"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { FilterState } from "@/lib/types"
import { Filter, X } from "lucide-react"

interface FilterBarProps {
  filter: FilterState
  onFilterChange: (filter: FilterState) => void
  availableProvinces?: string[]
  availableMonths?: string[]
  availableYears?: string[]
}

export function FilterBar({
  filter,
  onFilterChange,
  availableProvinces = [],
  availableMonths = [],
  availableYears = [],
}: FilterBarProps) {
  const [filterType, setFilterType] = useState<"all" | "province" | "month" | "year">(filter.type)
  const [filterValue, setFilterValue] = useState(filter.value)

  const handleApplyFilter = () => {
    if (filterType !== "all" && !filterValue) {
      alert("Please enter or select a value to filter.")
      return
    }
    onFilterChange({ type: filterType, value: filterValue })
  }

  const handleClearFilter = () => {
    setFilterType("all")
    setFilterValue("")
    onFilterChange({ type: "all", value: "" })
  }

  const hasActiveFilter = filter.type !== "all" && filter.value !== ""

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
            {hasActiveFilter && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 glass-strong border-border/50" align="end">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Filter Type</label>
              <Select
                value={filterType}
                onValueChange={(value: "all" | "province" | "month" | "year") => {
                  setFilterType(value)
                  setFilterValue("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="province">Province</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "province" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Province</label>
                {availableProvinces.length > 0 ? (
                  <Select value={filterValue} onValueChange={(value: string) => setFilterValue(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProvinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    placeholder="Enter province name"
                    value={filterValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterValue(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {filterType === "month" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Month</label>
                <Select value={filterValue} onValueChange={(value: string) => setFilterValue(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                        {new Date(2000, i).toLocaleString("default", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === "year" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Year</label>
                <Select value={filterValue} onValueChange={(value: string) => setFilterValue(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => (
                      <SelectItem key={2000 + i} value={String(2000 + i)}>
                        {2000 + i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleApplyFilter} size="sm" className="flex-1">
                Apply
              </Button>
              {hasActiveFilter && (
                <Button onClick={handleClearFilter} size="sm" variant="outline" className="gap-2">
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilter && (
        <Badge variant="secondary" className="gap-2">
          {filter.type}: {filter.value}
          <button
            onClick={handleClearFilter}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
    </div>
  )
}
