"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void
}

export function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    onDateRangeChange(date || null, endDate || null)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    onDateRangeChange(startDate || null, date || null)
  }

  const handleClear = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    onDateRangeChange(null, null)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={startDate}
            onSelect={handleStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">to</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={endDate}
            onSelect={handleEndDateChange}
            initialFocus
            disabled={(date) => startDate ? date < startDate : false}
          />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      )}
    </div>
  )
}
