'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { exportDashboardData, exportToJSON } from '@/lib/export-utils';

export default function ExportButtons({ dashboardData, activeTab, loading }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format, type) => {
    if (!dashboardData) return;

    setExporting(true);
    try {
      if (format === 'csv') {
        exportDashboardData(dashboardData, type);
      } else if (format === 'json') {
        const timestamp = new Date().toISOString().split('T')[0];
        exportToJSON(dashboardData, `cwago-${type}-${timestamp}.json`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getExportOptions = () => {
    switch (activeTab) {
      case 'overview':
        return [
          { label: 'Overview Data (CSV)', format: 'csv', type: 'overview' },
          { label: 'Overview Data (JSON)', format: 'json', type: 'overview' },
        ];
      case 'analytics':
        return [
          { label: 'Analytics Trends (CSV)', format: 'csv', type: 'analytics' },
          { label: 'Analytics Trends (JSON)', format: 'json', type: 'analytics' },
        ];
      default:
        return [
          { label: 'Full Dataset (CSV)', format: 'csv', type: 'full' },
          { label: 'Full Dataset (JSON)', format: 'json', type: 'full' },
        ];
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading || exporting}>
          {exporting ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {getExportOptions().map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleExport(option.format, option.type)}
            disabled={exporting}
          >
            {option.format === 'csv' ? (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
