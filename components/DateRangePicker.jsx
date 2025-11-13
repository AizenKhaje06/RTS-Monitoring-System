'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DateRangePicker({ dateRange, onDateRangeChange, onApply, loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState(dateRange);

  const handleApply = () => {
    onDateRangeChange(tempRange);
    onApply(tempRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultRange = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
    };
    setTempRange(defaultRange);
    onDateRangeChange(defaultRange);
    onApply(defaultRange);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !tempRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {tempRange?.from ? (
              tempRange.to ? (
                <>
                  {format(tempRange.from, 'LLL dd, y')} -{' '}
                  {format(tempRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(tempRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="space-y-2">
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setTempRange({
                        from: today,
                        to: today,
                      });
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      setTempRange({
                        from: yesterday,
                        to: yesterday,
                      });
                    }}
                  >
                    Yesterday
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      setTempRange({
                        from: last7Days,
                        to: new Date(),
                      });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      setTempRange({
                        from: last30Days,
                        to: new Date(),
                      });
                    }}
                  >
                    Last 30 days
                  </Button>
                </div>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempRange?.from}
                selected={tempRange}
                onSelect={setTempRange}
                numberOfMonths={2}
              />
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleApply} disabled={loading}>
                  {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
