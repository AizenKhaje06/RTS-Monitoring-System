// Simple test for the full transformation
function parseDateString(dateStr) {
  if (!dateStr) return null;

  const trimmed = dateStr.trim().toUpperCase();

  // Check if it's a range (contains "-")
  if (trimmed.includes('-')) {
    // Handle format like "NOVEMBER 1-3, 2025"
    const rangeMatch = trimmed.match(/^([A-Z]+)\s+(\d+)-(\d+),\s*(\d{4})$/);
    if (rangeMatch) {
      const [, monthName, startDayStr, endDayStr, yearStr] = rangeMatch;
      const startDay = parseInt(startDayStr);
      const endDay = parseInt(endDayStr);
      const year = parseInt(yearStr);

      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();

      const startDate = new Date(year, monthIndex, startDay);
      const endDate = new Date(year, monthIndex, endDay);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

      return { isRange: true, startDate, endDate, days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 };
    }
  }

  // Single date - try standard parsing first
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return { isRange: false, date: parsed };
  }

  // Fallback: try to parse format like "NOVEMBER 4, 2025"
  const singleMatch = trimmed.match(/^([A-Z]+)\s+(\d+),\s*(\d{4})$/);
  if (singleMatch) {
    const [, monthName, dayStr, yearStr] = singleMatch;
    const day = parseInt(dayStr);
    const year = parseInt(yearStr);

    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const date = new Date(year, monthIndex, day);

    if (!isNaN(date.getTime())) {
      return { isRange: false, date };
    }
  }

  return null;
}

function transformCWAGOData(rows) {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Skip header row
  const dataRows = rows.slice(1);
  const expandedData = [];

  dataRows.forEach(row => {
    const parseNum = (val) => {
      if (!val) return 0;
      return parseFloat(val.toString().replace(/,/g, '')) || 0;
    };

    const dateParse = parseDateString(row[0]);
    if (!dateParse) {
      console.warn(`Invalid date format: ${row[0]}, skipping row`);
      return;
    }

    const baseObj = {
      // Core Data (A-F)
      averageSF: parseNum(row[1]),
      totalSFAmount: parseNum(row[2]),
      adsSpent: parseNum(row[3]),
      totalOrders: parseNum(row[4]),
      amount: parseNum(row[5]),
    };

    if (dateParse.isRange) {
      // Expand range into individual days
      const { startDate, days } = dateParse;
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dailyObj = {
          ...baseObj,
          date: currentDate,
        };

        // Divide numeric metrics equally across days
        const numericFields = [
          'averageSF', 'totalSFAmount', 'adsSpent', 'totalOrders', 'amount'
        ];

        numericFields.forEach(field => {
          dailyObj[field] = Math.round((baseObj[field] / days) * 100) / 100; // Round to 2 decimal places
        });

        expandedData.push(dailyObj);
      }
    } else {
      // Single date
      expandedData.push({
        ...baseObj,
        date: dateParse.date,
      });
    }
  });

  return expandedData.filter(obj => obj.date); // Filter out rows without dates
}

// Test the transformation
console.log('Testing data transformation...');

const testRows = [
  ['DATE', 'AVERAGE SF', 'TOTAL SF AMOUNT', 'ADS SPENT', 'ORDERS', 'AMOUNT'],
  ['NOVEMBER 1-3, 2025', '50', '150', '100', '400', '2000'],
  ['NOVEMBER 4, 2025', '45', '135', '90', '143', '1800'],
  ['NOVEMBER 5, 2025', '48', '144', '95', '142', '1750']
];

const result = transformCWAGOData(testRows);
console.log('Number of transformed records:', result.length);
console.log('Records:');
result.forEach((record, i) => {
  console.log(`Record ${i}:`, record);
});
