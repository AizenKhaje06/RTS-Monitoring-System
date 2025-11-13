/**
 * Export Utilities for CWAGO Dashboard (Step 12)
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => col.label).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(data, filename = 'export.csv') {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Export dashboard data to CSV
 */
export function exportDashboardData(dashboardData, type = 'overview') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (type === 'overview' && dashboardData.overview) {
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'totalOrders', label: 'Total Orders' },
      { key: 'amount', label: 'Revenue' },
      { key: 'delivered', label: 'Delivered' },
      { key: 'inTransit', label: 'In Transit' },
      { key: 'detained', label: 'Detained' },
      { key: 'returned', label: 'Returned' },
      { key: 'cancelled', label: 'Cancelled' },
    ];
    
    const csv = convertToCSV([dashboardData.overview.latest], columns);
    downloadCSV(csv, `cwago-overview-${timestamp}.csv`);
  } else if (type === 'full' && dashboardData.rawData) {
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'totalOrders', label: 'Total Orders' },
      { key: 'amount', label: 'Revenue' },
      { key: 'averageSF', label: 'Avg Shipping Fee' },
      { key: 'totalSFAmount', label: 'Total Shipping' },
      { key: 'adsSpent', label: 'Ad Spend' },
      { key: 'pendingNotPrinted', label: 'Pending Not Printed' },
      { key: 'printedWaybill', label: 'Printed Waybill' },
      { key: 'fulfilledOrder', label: 'Fulfilled' },
      { key: 'inTransit', label: 'In Transit' },
      { key: 'onDelivery', label: 'On Delivery' },
      { key: 'detained', label: 'Detained' },
      { key: 'delivered', label: 'Delivered' },
      { key: 'cancelled', label: 'Cancelled' },
      { key: 'returned', label: 'Returned' },
      { key: 'deliveredPercent', label: 'Delivery Rate %' },
    ];
    
    const csv = convertToCSV(dashboardData.rawData, columns);
    downloadCSV(csv, `cwago-complete-data-${timestamp}.csv`);
  } else if (type === 'analytics' && dashboardData.analytics) {
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'totalOrders', label: 'Total Orders' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'delivered', label: 'Delivered' },
      { key: 'deliveredPercent', label: 'Delivery %' },
      { key: 'inTransit', label: 'In Transit' },
      { key: 'detained', label: 'Detained' },
      { key: 'returned', label: 'Returned' },
      { key: 'cancelled', label: 'Cancelled' },
      { key: 'adsSpent', label: 'Ad Spend' },
    ];
    
    const csv = convertToCSV(dashboardData.analytics.trends, columns);
    downloadCSV(csv, `cwago-analytics-${timestamp}.csv`);
  }
}

/**
 * Export to JSON
 */
export function exportToJSON(data, filename = 'export.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Compress data (Step 15)
 */
export function compressData(data) {
  // Simple compression by removing unnecessary fields
  return data.map(item => {
    const compressed = {};
    // Only include non-zero and non-null values
    Object.keys(item).forEach(key => {
      if (item[key] !== 0 && item[key] !== null && item[key] !== '') {
        compressed[key] = item[key];
      }
    });
    return compressed;
  });
}
