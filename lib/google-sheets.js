import { getGoogleSheetsClient as sheetsClient } from "./google-sheets-client.js"
import { logger } from "./logger.js"
import { SheetsError } from "./error-handler.js"

/**
 * Fetch data from Google Sheet with formatting to exclude separator rows
 * @param {string} range - Optional range specification
 * @param {string} startDate - Optional start date for filtering (YYYY-MM-DD)
 * @param {string} endDate - Optional end date for filtering (YYYY-MM-DD)
 */
export async function getSheetData(range, startDate = null, endDate = null) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID
    const sheetName = process.env.GOOGLE_SHEET_NAME || "CWAGO"
    const defaultRange = process.env.GOOGLE_SHEET_RANGE || "A:AZ"

    if (!sheetId) {
      throw new SheetsError("Missing GOOGLE_SHEET_ID in environment variables")
    }

    const sheets = sheetsClient()
    const fullRange = range || `${sheetName}!${defaultRange}`

    logger.debug("Fetching data with range", { range: fullRange })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        ranges: [fullRange],
        includeGridData: true,
      })

      clearTimeout(timeoutId)

      const sheet = response.data.sheets[0]
      const gridData = sheet.data[0]

      if (!gridData || !gridData.rowData) {
        logger.warn("No data found in the specified range", { range: fullRange })
        return []
      }

      const rows = []
      const separatorColors = [
        { red: 121 / 255, green: 125 / 255, blue: 125 / 255 }, // #797d7d
        { red: 182 / 255, green: 215 / 255, blue: 168 / 255 }, // #b6d7a8
      ]

      for (const row of gridData.rowData) {
        if (!row.values) continue

        let isSeparator = false
        for (const cell of row.values) {
          if (cell.effectiveFormat?.backgroundColor) {
            const bg = cell.effectiveFormat.backgroundColor
            if (
              separatorColors.some(
                (color) =>
                  Math.abs(bg.red - color.red) < 0.01 &&
                  Math.abs(bg.green - color.green) < 0.01 &&
                  Math.abs(bg.blue - color.blue) < 0.01,
              )
            ) {
              isSeparator = true
              break
            }
          }
        }

        if (!isSeparator) {
          const rowValues = row.values.map((cell) => cell.formattedValue || cell.userEnteredValue || "")
          rows.push(rowValues)
        }
      }

      logger.info(`Fetched ${rows.length} rows from Google Sheets`)
      return rows
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        throw new SheetsError("Request timeout - Google Sheets API took too long to respond")
      }
      throw error
    }
  } catch (error) {
    if (error instanceof SheetsError) {
      throw error
    }
    throw new SheetsError(`Failed to fetch Google Sheets data: ${error.message}`, error)
  }
}

/**
 * Parse date string, handling both single dates and ranges
 */
function parseDateString(dateStr) {
  if (!dateStr) return null

  const trimmed = dateStr.trim().toUpperCase()

  // Check if it's a range (contains "-")
  if (trimmed.includes("-")) {
    // Handle format like "NOVEMBER 1-3, 2025"
    const rangeMatch = trimmed.match(/^([A-Z]+)\s+(\d+)-(\d+),\s*(\d{4})$/)
    if (rangeMatch) {
      const [, monthName, startDayStr, endDayStr, yearStr] = rangeMatch
      const startDay = Number.parseInt(startDayStr)
      const endDay = Number.parseInt(endDayStr)
      const year = Number.parseInt(yearStr)

      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()

      const startDate = new Date(year, monthIndex, startDay)
      const endDate = new Date(year, monthIndex, endDay)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null

      return { isRange: true, startDate, endDate, days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 }
    }
  }

  // Single date - try standard parsing first
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return { isRange: false, date: parsed }
  }

  // Fallback: try to parse format like "NOVEMBER 4, 2025"
  const singleMatch = trimmed.match(/^([A-Z]+)\s+(\d+),\s*(\d{4})$/)
  if (singleMatch) {
    const [, monthName, dayStr, yearStr] = singleMatch
    const day = Number.parseInt(dayStr)
    const year = Number.parseInt(yearStr)

    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()
    const date = new Date(year, monthIndex, day)

    if (!isNaN(date.getTime())) {
      return { isRange: false, date }
    }
  }

  return null
}

/**
 * Transform CWAGO tracking sheet data
 */
export function transformCWAGOData(rows) {
  if (!rows || rows.length === 0) {
    return []
  }

  // Skip header row
  const dataRows = rows.slice(1)
  const expandedData = []

  dataRows.forEach((row) => {
    const parseNum = (val) => {
      if (!val) return 0
      return Number.parseFloat(val.toString().replace(/,/g, "")) || 0
    }

    const dateParse = parseDateString(row[0])
    if (!dateParse) {
      console.warn(`Invalid date format: ${row[0]}, skipping row`)
      return
    }

    const baseObj = {
      // Core Data (A-F)
      averageSF: parseNum(row[1]),
      totalSFAmount: parseNum(row[2]),
      adsSpent: parseNum(row[3]),
      totalOrders: parseNum(row[4]),
      amount: parseNum(row[5]),

      // Cancelled Without Price (H-I)
      cancelledWithoutPrice: parseNum(row[7]),
      cancelledWithoutPricePercent: parseNum(row[8]),

      // Pending Not Printed (J-L)
      pendingNotPrinted: parseNum(row[9]),
      pendingNotPrintedAmount: parseNum(row[10]),
      pendingNotPrintedPercent: parseNum(row[11]),

      // Printed Waybill (M-O)
      printedWaybill: parseNum(row[12]),
      printedWaybillAmount: parseNum(row[13]),
      printedWaybillPercent: parseNum(row[14]),

      // Fulfilled Order (P-R)
      fulfilledOrder: parseNum(row[15]),
      fulfilledOrderAmount: parseNum(row[16]),
      fulfilledOrderPercent: parseNum(row[17]),

      // Pending Printed Waybill (S-U)
      pendingPrintedWaybill: parseNum(row[18]),
      pendingPrintedWaybillAmount: parseNum(row[19]),
      pendingPrintedWaybillPercent: parseNum(row[20]),

      // In Transit (Z-AB)
      inTransit: parseNum(row[25]),
      inTransitAmount: parseNum(row[26]),
      inTransitPercent: parseNum(row[27]),

      // On Delivery (AC-AE)
      onDelivery: parseNum(row[28]),
      onDeliveryAmount: parseNum(row[29]),
      onDeliveryPercent: parseNum(row[30]),

      // Detained (AF-AH)
      detained: parseNum(row[31]),
      detainedAmount: parseNum(row[32]),
      detainedPercent: parseNum(row[33]),

      // Delivered (AI-AK)
      delivered: parseNum(row[34]),
      deliveredAmount: parseNum(row[35]),
      deliveredPercent: parseNum(row[36]),

      // Cancelled (W-X-Y) - calculate count from percent if sheet count is 0
      cancelled: parseNum(row[22]),
      cancelledAmount: parseNum(row[23]),
      cancelledPercent: parseNum(row[24]),

      // Returned (AL-AN)
      returned: parseNum(row[37]),
      returnedAmount: parseNum(row[38]),
      returnedPercent: parseNum(row[39]),

      // Not Yet Delivered (AR)
      notYetDeliverPercent: parseNum(row[43]),
    }

    // Calculate cancelled count from percent if the sheet count is 0 but percent exists
    if (baseObj.cancelled === 0 && baseObj.cancelledPercent > 0 && baseObj.totalOrders > 0) {
      baseObj.cancelled = Math.round((baseObj.cancelledPercent / 100) * baseObj.totalOrders)
    }

    if (dateParse.isRange) {
      // Expand range into individual days
      const { startDate, days } = dateParse
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)

        const dailyObj = {
          ...baseObj,
          date: currentDate,
        }

        // Divide numeric metrics equally across days, avoiding decimals by distributing remainder to last day
        const numericFields = [
          "averageSF",
          "totalSFAmount",
          "adsSpent",
          "totalOrders",
          "amount",
          "cancelledWithoutPrice",
          "pendingNotPrinted",
          "pendingNotPrintedAmount",
          "printedWaybill",
          "printedWaybillAmount",
          "fulfilledOrder",
          "fulfilledOrderAmount",
          "pendingPrintedWaybill",
          "pendingPrintedWaybillAmount",
          "inTransit",
          "inTransitAmount",
          "onDelivery",
          "onDeliveryAmount",
          "detained",
          "detainedAmount",
          "delivered",
          "deliveredAmount",
          "cancelled",
          "cancelledAmount",
          "returned",
          "returnedAmount",
        ]

        numericFields.forEach((field) => {
          const total = baseObj[field]
          const perDay = Math.floor(total / days)
          const remainder = total % days
          // Distribute remainder to the last day
          dailyObj[field] = i === days - 1 ? perDay + remainder : perDay
        })

        expandedData.push(dailyObj)
      }
    } else {
      // Single date
      expandedData.push({
        ...baseObj,
        date: dateParse.date,
      })
    }
  })

  return expandedData.filter((obj) => obj.date) // Filter out rows without dates
}

/**
 * Helper function to get the latest data point by date
 */
function getLatestDataPoint(data) {
  if (!data || data.length === 0) return null
  return data.reduce((latest, current) => {
    return new Date(current.date) > new Date(latest.date) ? current : latest
  })
}

/**
 * Get overview metrics from latest data
 */
export async function getOverviewMetrics(data = null) {
  try {
    if (!data) {
      const rows = await getSheetData()
      data = transformCWAGOData(rows)
    }

    if (data.length === 0) {
      return null
    }

    // Get latest day's data
    const latest = getLatestDataPoint(data)

    // Calculate percentages for latest data point (use sheet values for delivered and cancelled)
    latest.inTransitPercent = latest.totalOrders > 0 ? (latest.inTransit / latest.totalOrders) * 100 : 0
    latest.detainedPercent = latest.totalOrders > 0 ? (latest.detained / latest.totalOrders) * 100 : 0
    latest.returnedPercent = latest.totalOrders > 0 ? (latest.returned / latest.totalOrders) * 100 : 0
    latest.pendingNotPrintedPercent = latest.totalOrders > 0 ? (latest.pendingNotPrinted / latest.totalOrders) * 100 : 0
    latest.cancelledPercent = latest.totalOrders > 0 ? (latest.cancelled / latest.totalOrders) * 100 : 0

    // Calculate totals from all historical data
    const totals = data.reduce(
      (acc, day) => {
        acc.totalOrders += day.totalOrders
        acc.totalRevenue += day.amount
        acc.totalSFAmount += day.totalSFAmount
        acc.totalAdsSpent += day.adsSpent
        acc.totalDelivered += day.delivered
        acc.totalCancelled += day.cancelled
        acc.totalReturned += day.returned
        acc.returnedAmount += day.returnedAmount
        // Add detailed status totals
        acc.pendingNotPrinted += day.pendingNotPrinted
        acc.printedWaybill += day.printedWaybill
        acc.pendingPrintedWaybill += day.pendingPrintedWaybill
        acc.fulfilledOrder += day.fulfilledOrder
        acc.inTransit += day.inTransit
        acc.onDelivery += day.onDelivery
        acc.detained += day.detained
        acc.cancelledWithoutPrice += day.cancelledWithoutPrice
        // Add amount totals
        acc.pendingNotPrintedAmount += day.pendingNotPrintedAmount
        acc.printedWaybillAmount += day.printedWaybillAmount
        acc.pendingPrintedWaybillAmount += day.pendingPrintedWaybillAmount
        acc.fulfilledOrderAmount += day.fulfilledOrderAmount
        acc.inTransitAmount += day.inTransitAmount
        acc.onDeliveryAmount += day.onDeliveryAmount
        acc.deliveredAmount += day.deliveredAmount
        acc.detainedAmount += day.detainedAmount
        acc.cancelledAmount += day.cancelledAmount
        return acc
      },
      {
        totalOrders: 0,
        totalRevenue: 0,
        totalSFAmount: 0,
        totalAdsSpent: 0,
        totalDelivered: 0,
        totalCancelled: 0,
        totalReturned: 0,
        returned: 0,
        // Initialize detailed status totals
        pendingNotPrinted: 0,
        printedWaybill: 0,
        pendingPrintedWaybill: 0,
        fulfilledOrder: 0,
        inTransit: 0,
        onDelivery: 0,
        detained: 0,
        cancelledWithoutPrice: 0,

        // Initialize amount totals
        pendingNotPrintedAmount: 0,
        printedWaybillAmount: 0,
        pendingPrintedWaybillAmount: 0,
        fulfilledOrderAmount: 0,
        inTransitAmount: 0,
        onDeliveryAmount: 0,
        deliveredAmount: 0,
        detainedAmount: 0,
        cancelledAmount: 0,
        returnedAmount: 0,
      },
    )
    // Set returned count for frontend compatibility
    totals.returned = totals.totalReturned

    // Calculate percentages for each status
    const totalOrders = totals.totalOrders
    totals.pendingNotPrintedPercent = totalOrders > 0 ? (totals.pendingNotPrinted / totalOrders) * 100 : 0
    totals.printedWaybillPercent = totalOrders > 0 ? (totals.printedWaybill / totalOrders) * 100 : 0
    totals.pendingPrintedWaybillPercent = totalOrders > 0 ? (totals.pendingPrintedWaybill / totalOrders) * 100 : 0
    totals.fulfilledOrderPercent = totalOrders > 0 ? (totals.fulfilledOrder / totalOrders) * 100 : 0
    totals.inTransitPercent = totalOrders > 0 ? (totals.inTransit / totalOrders) * 100 : 0
    totals.onDeliveryPercent = totalOrders > 0 ? (totals.onDelivery / totalOrders) * 100 : 0
    totals.deliveredPercent = totalOrders > 0 ? (totals.totalDelivered / totalOrders) * 100 : 0
    totals.detainedPercent = totalOrders > 0 ? (totals.detained / totalOrders) * 100 : 0
    totals.cancelledPercent = totalOrders > 0 ? (totals.totalCancelled / totalOrders) * 100 : 0
    totals.cancelledWithoutPricePercent = totalOrders > 0 ? (totals.cancelledWithoutPrice / totalOrders) * 100 : 0
    totals.returnedPercent = totalOrders > 0 ? (totals.returned / totalOrders) * 100 : 0

    return {
      latest,
      totals,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error getting overview metrics:", error)
    throw error
  }
}

/**
 * Get order lifecycle funnel data
 */
export async function getOrderLifecycle(data = null) {
  try {
    if (!data) {
      const rows = await getSheetData()
      data = transformCWAGOData(rows)
    }

    if (data.length === 0) {
      return null
    }

    // Aggregate data across the period
    const aggregated = data.reduce(
      (acc, day) => {
        acc.totalOrders += day.totalOrders
        acc.amount += day.amount
        acc.pendingNotPrinted += day.pendingNotPrinted
        acc.pendingNotPrintedAmount += day.pendingNotPrintedAmount
        acc.printedWaybill += day.printedWaybill
        acc.printedWaybillAmount += day.printedWaybillAmount
        acc.fulfilledOrder += day.fulfilledOrder
        acc.fulfilledOrderAmount += day.fulfilledOrderAmount
        acc.pendingPrintedWaybill += day.pendingPrintedWaybill
        acc.pendingPrintedWaybillAmount += day.pendingPrintedWaybillAmount
        acc.inTransit += day.inTransit
        acc.inTransitAmount += day.inTransitAmount
        acc.onDelivery += day.onDelivery
        acc.onDeliveryAmount += day.onDeliveryAmount
        acc.delivered += day.delivered
        acc.deliveredAmount += day.deliveredAmount
        acc.returned += day.returned
        acc.returnedAmount += day.returnedAmount
        acc.detained += day.detained
        acc.detainedAmount += day.detainedAmount
        acc.cancelled += day.cancelled
        acc.cancelledAmount += day.cancelledAmount
        acc.cancelledWithoutPrice += day.cancelledWithoutPrice
        return acc
      },
      {
        totalOrders: 0,
        amount: 0,
        pendingNotPrinted: 0,
        pendingNotPrintedAmount: 0,
        printedWaybill: 0,
        printedWaybillAmount: 0,
        fulfilledOrder: 0,
        fulfilledOrderAmount: 0,
        pendingPrintedWaybill: 0,
        pendingPrintedWaybillAmount: 0,
        inTransit: 0,
        inTransitAmount: 0,
        onDelivery: 0,
        onDeliveryAmount: 0,
        delivered: 0,
        deliveredAmount: 0,
        returned: 0,
        returnedAmount: 0,
        detained: 0,
        detainedAmount: 0,
        cancelled: 0,
        cancelledAmount: 0,
        cancelledWithoutPrice: 0,
      },
    )

    // Calculate percentages based on total orders
    const totalOrders = aggregated.totalOrders
    const stages = [
      { name: "Total Orders", count: aggregated.totalOrders, amount: aggregated.amount, percent: 100 },
      {
        name: "Pending Not Printed",
        count: aggregated.pendingNotPrinted,
        amount: aggregated.pendingNotPrintedAmount,
        percent: totalOrders > 0 ? (aggregated.pendingNotPrinted / totalOrders) * 100 : 0,
      },
      {
        name: "Printed Waybill",
        count: aggregated.printedWaybill,
        amount: aggregated.printedWaybillAmount,
        percent: totalOrders > 0 ? (aggregated.printedWaybill / totalOrders) * 100 : 0,
      },
      {
        name: "Pending Printed Waybill",
        count: aggregated.pendingPrintedWaybill,
        amount: aggregated.pendingPrintedWaybillAmount,
        percent: totalOrders > 0 ? (aggregated.pendingPrintedWaybill / totalOrders) * 100 : 0,
      },
      {
        name: "Fulfilled",
        count: aggregated.fulfilledOrder,
        amount: aggregated.fulfilledOrderAmount,
        percent: totalOrders > 0 ? (aggregated.fulfilledOrder / totalOrders) * 100 : 0,
      },
      {
        name: "In Transit",
        count: aggregated.inTransit,
        amount: aggregated.inTransitAmount,
        percent: totalOrders > 0 ? (aggregated.inTransit / totalOrders) * 100 : 0,
      },
      {
        name: "On Delivery",
        count: aggregated.onDelivery,
        amount: aggregated.onDeliveryAmount,
        percent: totalOrders > 0 ? (aggregated.onDelivery / totalOrders) * 100 : 0,
      },
      {
        name: "Delivered",
        count: aggregated.delivered,
        amount: aggregated.deliveredAmount,
        percent: totalOrders > 0 ? (aggregated.delivered / totalOrders) * 100 : 0,
      },
      {
        name: "Returned",
        count: aggregated.returned,
        amount: aggregated.returnedAmount,
        percent: totalOrders > 0 ? (aggregated.returned / totalOrders) * 100 : 0,
      },
      {
        name: "Detained",
        count: aggregated.detained,
        amount: aggregated.detainedAmount,
        percent: totalOrders > 0 ? (aggregated.detained / totalOrders) * 100 : 0,
      },
      {
        name: "Cancelled",
        count: aggregated.cancelled,
        amount: aggregated.cancelledAmount,
        percent: totalOrders > 0 ? (aggregated.cancelled / totalOrders) * 100 : 0,
      },
      {
        name: "Cancelled w/o Price",
        count: aggregated.cancelledWithoutPrice,
        amount: 0,
        percent: totalOrders > 0 ? (aggregated.cancelledWithoutPrice / totalOrders) * 100 : 0,
      },
    ]

    const latest = getLatestDataPoint(data)

    return {
      stages,
      date: latest.date,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error getting order lifecycle:", error)
    throw error
  }
}

/**
 * Get issues and alerts data
 */
export async function getIssuesData(data = null) {
  try {
    if (!data) {
      const rows = await getSheetData()
      data = transformCWAGOData(rows)
    }

    if (data.length === 0) {
      return null
    }

    // Aggregate data across the period
    const aggregated = data.reduce(
      (acc, day) => {
        acc.totalOrders += day.totalOrders
        acc.detained += day.detained
        acc.detainedAmount += day.detainedAmount
        acc.returned += day.returned
        acc.returnedAmount += day.returnedAmount
        acc.cancelled += day.cancelled
        acc.cancelledAmount += day.cancelledAmount
        acc.cancelledPercent += day.cancelledPercent
        acc.pendingNotPrinted += day.pendingNotPrinted
        acc.pendingNotPrintedAmount += day.pendingNotPrintedAmount
        acc.pendingPrintedWaybill += day.pendingPrintedWaybill
        acc.pendingPrintedWaybillAmount += day.pendingPrintedWaybillAmount
        acc.cancelledWithoutPrice += day.cancelledWithoutPrice
        return acc
      },
      {
        totalOrders: 0,
        detained: 0,
        detainedAmount: 0,
        returned: 0,
        returnedAmount: 0,
        cancelled: 0,
        cancelledAmount: 0,
        cancelledPercent: 0,
        pendingNotPrinted: 0,
        pendingNotPrintedAmount: 0,
        pendingPrintedWaybill: 0,
        pendingPrintedWaybillAmount: 0,
        cancelledWithoutPrice: 0,
      },
    )

    // Calculate percentages based on total orders
    const totalOrders = aggregated.totalOrders
    const detainedPercent = totalOrders > 0 ? (aggregated.detained / totalOrders) * 100 : 0
    const rtsPercent = totalOrders > 0 ? (aggregated.returned / totalOrders) * 100 : 0
    const cancelledPercent = totalOrders > 0 ? (aggregated.cancelled / totalOrders) * 100 : 0
    const pendingNotPrintedPercent = totalOrders > 0 ? (aggregated.pendingNotPrinted / totalOrders) * 100 : 0

    // Identify issues based on thresholds
    const issues = []

    // High detention rate
    if (detainedPercent > 5) {
      issues.push({
        type: "Detention Alert",
        priority: "high",
        message: `High detention rate: ${detainedPercent.toFixed(2)}% (${aggregated.detained} orders)`,
        count: aggregated.detained,
        amount: aggregated.detainedAmount,
      })
    }

    // High return rate
    if (rtsPercent > 10) {
      issues.push({
        type: "Return Alert",
        priority: "high",
        message: `High return rate: ${rtsPercent.toFixed(2)}% (${aggregated.returned} orders)`,
        count: aggregated.returned,
        amount: aggregated.returnedAmount,
      })
    }

    // High cancellation rate
    if (cancelledPercent > 15) {
      issues.push({
        type: "Cancellation Alert",
        priority: "medium",
        message: `High cancellation rate: ${cancelledPercent.toFixed(2)}% (${aggregated.cancelled} orders)`,
        count: aggregated.cancelled,
        amount: aggregated.cancelledAmount,
      })
    }

    // Pending orders backlog
    if (pendingNotPrintedPercent > 20) {
      issues.push({
        type: "Processing Backlog",
        priority: "high",
        message: `Processing backlog: ${pendingNotPrintedPercent.toFixed(2)}% (${aggregated.pendingNotPrinted} orders)`,
        count: aggregated.pendingNotPrinted,
        amount: aggregated.pendingNotPrintedAmount,
      })
    }

    const latest = getLatestDataPoint(data)

    // Calculate percentages for pending statuses
    const pendingPrintedWaybillPercent = totalOrders > 0 ? (aggregated.pendingPrintedWaybill / totalOrders) * 100 : 0

    return {
      issues,
      detained: { count: aggregated.detained, amount: aggregated.detainedAmount, percent: detainedPercent },
      returned: { count: aggregated.returned, amount: aggregated.returnedAmount, percent: rtsPercent },
      cancelled: { count: aggregated.cancelled, amount: aggregated.cancelledAmount, percent: cancelledPercent },
      pendingNotPrinted: {
        count: aggregated.pendingNotPrinted,
        amount: aggregated.pendingNotPrintedAmount,
        percent: pendingNotPrintedPercent,
      },
      pendingPrintedWaybill: {
        count: aggregated.pendingPrintedWaybill,
        amount: aggregated.pendingPrintedWaybillAmount,
        percent: pendingPrintedWaybillPercent,
      },
      cancelledWithoutPrice: {
        count: aggregated.cancelledWithoutPrice,
        amount: 0,
        percent: totalOrders > 0 ? (aggregated.cancelledWithoutPrice / totalOrders) * 100 : 0,
      },
      date: latest.date,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error getting issues data:", error)
    throw error
  }
}

/**
 * Get financial metrics
 */
export async function getFinancialMetrics(data = null) {
  try {
    if (!data) {
      const rows = await getSheetData()
      data = transformCWAGOData(rows)
    }

    if (data.length === 0) {
      return null
    }

    // Aggregate data across the period
    const aggregated = data.reduce(
      (acc, day) => {
        acc.totalOrders += day.totalOrders
        acc.amount += day.amount
        acc.totalSFAmount += day.totalSFAmount
        acc.adsSpent += day.adsSpent
        acc.averageSF += day.averageSF
        return acc
      },
      {
        totalOrders: 0,
        amount: 0,
        totalSFAmount: 0,
        adsSpent: 0,
        averageSF: 0,
      },
    )

    // Calculate average shipping fee
    const avgShippingFee = data.length > 0 ? aggregated.averageSF / data.length : 0

    // Calculate financial ratios
    const grossRevenue = aggregated.amount
    const shippingFees = aggregated.totalSFAmount
    const adSpend = aggregated.adsSpent
    const netRevenue = grossRevenue - shippingFees - adSpend
    const profitMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0
    const avgOrderValue = aggregated.totalOrders > 0 ? grossRevenue / aggregated.totalOrders : 0
    const cpa = aggregated.totalOrders > 0 ? adSpend / aggregated.totalOrders : 0 // Cost per acquisition

    // Get delivered financial metrics
    const deliveredFinancial = await getDeliveredFinancialMetrics(data)

    const latest = getLatestDataPoint(data)

    return {
      grossRevenue,
      shippingFees,
      adSpend,
      netRevenue,
      profitMargin,
      avgOrderValue,
      avgShippingFee,
      cpa,
      totalOrders: aggregated.totalOrders,
      date: latest.date,
      lastUpdated: new Date().toISOString().split("T")[0],
      delivered: deliveredFinancial,
    }
  } catch (error) {
    console.error("Error getting financial metrics:", error)
    throw error
  }
}

/**
 * Get financial metrics for delivered orders only
 */
export async function getDeliveredFinancialMetrics(data = null) {
  try {
    if (!data) {
      const rows = await getSheetData()
      data = transformCWAGOData(rows)
    }

    if (data.length === 0) {
      return null
    }

    // Aggregate data only for delivered orders
    const aggregated = data.reduce(
      (acc, day) => {
        acc.deliveredOrders += day.delivered
        acc.deliveredAmount += day.deliveredAmount
        acc.totalSFAmount += day.totalSFAmount // Keep total shipping fees for allocation
        acc.adsSpent += day.adsSpent // Keep total ad spend for allocation
        acc.averageSF += day.averageSF
        return acc
      },
      {
        deliveredOrders: 0,
        deliveredAmount: 0,
        totalSFAmount: 0,
        adsSpent: 0,
        averageSF: 0,
      },
    )

    // Calculate average shipping fee
    const avgShippingFee = data.length > 0 ? aggregated.averageSF / data.length : 0

    // Allocate costs proportionally based on delivered orders vs total orders
    const totalOrders = data.reduce((sum, day) => sum + day.totalOrders, 0)
    const allocationRatio = totalOrders > 0 ? aggregated.deliveredOrders / totalOrders : 0

    const shippingFees = aggregated.totalSFAmount * allocationRatio
    const adSpend = aggregated.adsSpent * allocationRatio

    // Calculate financial ratios for delivered orders
    const grossRevenue = aggregated.deliveredAmount
    const netRevenue = grossRevenue - shippingFees - adSpend
    const profitMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0
    const avgOrderValue = aggregated.deliveredOrders > 0 ? grossRevenue / aggregated.deliveredOrders : 0
    const cpa = aggregated.deliveredOrders > 0 ? adSpend / aggregated.deliveredOrders : 0

    const latest = getLatestDataPoint(data)

    return {
      grossRevenue,
      shippingFees,
      adSpend,
      netRevenue,
      profitMargin,
      avgOrderValue,
      avgShippingFee,
      cpa,
      totalOrders: aggregated.deliveredOrders,
      date: latest.date,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error getting delivered financial metrics:", error)
    throw error
  }
}

/**
 * Get analytics with trend data
 */
export async function getAnalytics(data = null) {
  try {
    if (!data) {
      const rows = await getSheetData()
      data = transformCWAGOData(rows)
    }

    if (data.length === 0) {
      return null
    }

    // Get last 30 days or all available data
    const recentData = data.slice(-30)

    // Calculate trends
    const trends = recentData.map((day) => ({
      date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      totalOrders: day.totalOrders,
      revenue: day.amount,
      delivered: day.delivered,
      deliveredPercent: day.deliveredPercent,
      inTransit: day.inTransit,
      detained: day.detained,
      returned: day.returned,
      cancelled: day.cancelled,
      adsSpent: day.adsSpent,
      pendingNotPrinted: day.pendingNotPrinted,
    }))

    // Calculate conversion metrics from latest data
    const latest = data[data.length - 1]
    const conversionRate = latest.totalOrders > 0 ? (latest.delivered / latest.totalOrders) * 100 : 0
    const fulfillmentRate =
      latest.totalOrders > 0 ? ((latest.totalOrders - latest.pendingNotPrinted) / latest.totalOrders) * 100 : 0
    const successRate =
      latest.totalOrders - latest.cancelled > 0 ? (latest.delivered / (latest.totalOrders - latest.cancelled)) * 100 : 0

    // Calculate historical average delivery rate
    const avgDeliveryRate =
      trends.length > 0 ? trends.reduce((sum, day) => sum + (day.deliveredPercent || 0), 0) / trends.length : 0

    return {
      trends,
      metrics: {
        conversionRate,
        fulfillmentRate,
        successRate,
        avgDeliveryRate,
      },
      lastUpdated: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error getting analytics:", error)
    throw error
  }
}

/**
 * Aggregate data by month
 */
function aggregateByMonth(data) {
  const grouped = {}

  data.forEach((day) => {
    const date = new Date(day.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!grouped[key]) {
      grouped[key] = {
        date: new Date(date.getFullYear(), date.getMonth() + 1, 0), // Last day of month
        ...Object.keys(day).reduce((acc, k) => {
          if (typeof day[k] === "number") acc[k] = 0
          else acc[k] = day[k]
          return acc
        }, {}),
      }
    }

    // Sum numeric fields
    Object.keys(day).forEach((k) => {
      if (typeof day[k] === "number") {
        grouped[key][k] += day[k]
      }
    })
  })

  return Object.values(grouped).sort((a, b) => b.date - a.date)
}

/**
 * Aggregate data by year
 */
function aggregateByYear(data) {
  const grouped = {}

  data.forEach((day) => {
    const year = new Date(day.date).getFullYear()

    if (!grouped[year]) {
      grouped[year] = {
        date: new Date(year, 11, 31), // December 31
        ...Object.keys(day).reduce((acc, k) => {
          if (typeof day[k] === "number") acc[k] = 0
          else acc[k] = day[k]
          return acc
        }, {}),
      }
    }

    // Sum numeric fields
    Object.keys(day).forEach((k) => {
      if (typeof day[k] === "number") {
        grouped[year][k] += day[k]
      }
    })
  })

  return Object.values(grouped).sort((a, b) => b.date - a.date)
}

/**
 * Get complete dashboard data (all metrics combined)
 */
export async function getCompleteDashboardData(sortBy = "day", startDate = null, endDate = null) {
  try {
    const rows = await getSheetData()
    let allData = transformCWAGOData(rows)

    if (allData.length === 0) {
      return { success: false, error: "No data available" }
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      allData = allData.filter((row) => {
        const rowDate = new Date(row.date)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return rowDate >= start && rowDate <= end
      })
    }

    // Sort data based on sortBy parameter
    const sortedData = [...allData]
    if (sortBy === "month") {
      sortedData.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        const monthA = dateA.getFullYear() * 12 + dateA.getMonth()
        const monthB = dateB.getFullYear() * 12 + dateB.getMonth()
        return monthB - monthA // Descending
      })
    } else if (sortBy === "year") {
      sortedData.sort((a, b) => {
        const yearA = new Date(a.date).getFullYear()
        const yearB = new Date(b.date).getFullYear()
        return yearB - yearA // Descending
      })
    } else {
      // Default 'day' sorting - already sorted by date
      sortedData.sort((a, b) => new Date(b.date) - new Date(a.date))
    }

    // Aggregate data if needed
    let processedData = sortedData
    if (sortBy === "month") {
      processedData = aggregateByMonth(sortedData)
    } else if (sortBy === "year") {
      processedData = aggregateByYear(sortedData)
    }

    const [overview, lifecycle, issues, financial, analytics] = await Promise.all([
      getOverviewMetrics(processedData),
      getOrderLifecycle(processedData),
      getIssuesData(processedData),
      getFinancialMetrics(processedData),
      getAnalytics(allData), // Use allData for analytics to show trends regardless of date filter
    ])

    return {
      success: true,
      overview,
      lifecycle,
      issues,
      financial,
      analytics,
      rawData: processedData,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error getting complete dashboard data:", error)
    throw error
  }
}

/**
 * WRITE-BACK FUNCTIONS (Step 14)
 */

/**
 * Write data to Google Sheet
 */
export async function writeToSheet(range, values) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID
    if (!sheetId) {
      throw new Error("Missing GOOGLE_SHEET_ID")
    }

    const sheets = sheetsClient()

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: values,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error writing to sheet:", error)
    throw error
  }
}

/**
 * Append data to Google Sheet
 */
export async function appendToSheet(range, values) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID
    if (!sheetId) {
      throw new Error("Missing GOOGLE_SHEET_ID")
    }

    const sheets = sheetsClient()

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: values,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error appending to sheet:", error)
    throw error
  }
}

/**
 * Add note to order (audit trail)
 */
export async function addOrderNote(date, note, user = "System") {
  try {
    const timestamp = new Date().toISOString().split("T")[0]
    const auditEntry = [[timestamp, date, "NOTE_ADDED", note, user]]

    // Append to audit sheet (assumes Sheet2 for audit trail)
    await appendToSheet("AuditTrail!A:E", auditEntry)

    return { success: true, timestamp }
  } catch (error) {
    console.error("Error adding note:", error)
    throw error
  }
}

/**
 * Mark issue as resolved
 */
export async function markIssueResolved(date, issueType, resolutionNote, user = "System") {
  try {
    const timestamp = new Date().toISOString().split("T")[0]
    const auditEntry = [[timestamp, date, "ISSUE_RESOLVED", `${issueType}: ${resolutionNote}`, user]]

    // Log to audit trail
    await appendToSheet("AuditTrail!A:E", auditEntry)

    return { success: true, timestamp }
  } catch (error) {
    console.error("Error marking issue resolved:", error)
    throw error
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(date, column, newValue, user = "System") {
  try {
    // Find row by date and update specific column
    const rows = await getSheetData()
    const rowIndex = rows.findIndex((row) => row[0] === date)

    if (rowIndex === -1) {
      throw new Error("Order date not found")
    }

    // Update specific cell
    const cellRange = `Sheet1!${column}${rowIndex + 1}`
    await writeToSheet(cellRange, [[newValue]])

    // Log to audit trail
    const timestamp = new Date().toISOString().split("T")[0]
    const auditEntry = [[timestamp, date, "STATUS_UPDATE", `Updated ${column} to ${newValue}`, user]]
    await appendToSheet("AuditTrail!A:E", auditEntry)

    return { success: true, timestamp }
  } catch (error) {
    console.error("Error updating status:", error)
    throw error
  }
}

/**
 * FORECASTING (Step 11)
 */
export function calculateForecast(data, days = 7) {
  if (data.length < 3) {
    return null
  }

  // Simple linear regression for forecasting
  const recentData = data.slice(-30) // Last 30 days

  // Calculate average daily growth rate
  let orderGrowthSum = 0
  let revenueGrowthSum = 0
  let count = 0

  for (let i = 1; i < recentData.length; i++) {
    orderGrowthSum += recentData[i].totalOrders - recentData[i - 1].totalOrders
    revenueGrowthSum += recentData[i].amount - recentData[i - 1].amount
    count++
  }

  const avgOrderGrowth = orderGrowthSum / count
  const avgRevenueGrowth = revenueGrowthSum / count

  // Generate forecast
  const forecast = []
  const lastDay = recentData[recentData.length - 1]

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date()
    forecastDate.setDate(forecastDate.getDate() + i)

    forecast.push({
      date: forecastDate.toISOString().split("T")[0],
      forecastOrders: Math.max(0, Math.round(lastDay.totalOrders + avgOrderGrowth * i)),
      forecastRevenue: Math.max(0, Math.round(lastDay.amount + avgRevenueGrowth * i)),
      confidence: Math.max(0.5, 1 - i * 0.1), // Confidence decreases with time
    })
  }

  return {
    forecast,
    avgDailyOrderGrowth: avgOrderGrowth,
    avgDailyRevenueGrowth: avgRevenueGrowth,
  }
}

/**
 * BUDGET VS ACTUAL (Step 10)
 */
export async function getBudgetComparison() {
  try {
    const rows = await getSheetData()
    const data = transformCWAGOData(rows)

    if (data.length === 0) {
      return null
    }

    // Calculate actual metrics
    const actual = data.reduce(
      (acc, day) => {
        acc.revenue += day.amount
        acc.shippingCost += day.totalSFAmount
        acc.adSpend += day.adsSpent
        acc.orders += day.totalOrders
        return acc
      },
      { revenue: 0, shippingCost: 0, adSpend: 0, orders: 0 },
    )

    // Set budgets (these would come from a budget sheet or config)
    // For now, using 80% of actual as budget targets
    const budget = {
      revenue: actual.revenue * 1.2, // Target 20% more
      shippingCost: actual.shippingCost * 0.9, // Target 10% less
      adSpend: actual.adSpend * 0.85, // Target 15% less
      orders: actual.orders * 1.15, // Target 15% more
    }

    return {
      revenue: {
        budget: budget.revenue,
        actual: actual.revenue,
        variance: actual.revenue - budget.revenue,
        variancePercent: ((actual.revenue - budget.revenue) / budget.revenue) * 100,
      },
      shippingCost: {
        budget: budget.shippingCost,
        actual: actual.shippingCost,
        variance: budget.shippingCost - actual.shippingCost, // Positive is good for costs
        variancePercent: ((budget.shippingCost - actual.shippingCost) / budget.shippingCost) * 100,
      },
      adSpend: {
        budget: budget.adSpend,
        actual: actual.adSpend,
        variance: budget.adSpend - actual.adSpend,
        variancePercent: ((budget.adSpend - actual.adSpend) / budget.adSpend) * 100,
      },
      orders: {
        budget: budget.orders,
        actual: actual.orders,
        variance: actual.orders - budget.orders,
        variancePercent: ((actual.orders - budget.orders) / budget.orders) * 100,
      },
    }
  } catch (error) {
    console.error("Error getting budget comparison:", error)
    throw error
  }
}

/**
 * DATE RANGE FILTERING (Step 12)
 */
export async function getDataByDateRange(startDate, endDate) {
  try {
    const rows = await getSheetData()
    const allData = transformCWAGOData(rows)

    const filteredData = allData.filter((row) => {
      const rowDate = new Date(row.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return rowDate >= start && rowDate <= end
    })

    return filteredData
  } catch (error) {
    console.error("Error filtering by date range:", error)
    throw error
  }
}

/**
 * PAGINATION (Step 15)
 */
export function paginateData(data, page = 1, pageSize = 50) {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      page,
      pageSize,
      totalRecords: data.length,
      totalPages: Math.ceil(data.length / pageSize),
      hasNext: endIndex < data.length,
      hasPrev: page > 1,
    },
  }
}

/**
 * WEBHOOK NOTIFICATION (Step 13)
 */
export async function sendWebhookNotification(eventType, data) {
  const webhookUrl = process.env.WEBHOOK_URL

  if (!webhookUrl) {
    console.log("No webhook URL configured")
    return
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      event: eventType,
      data,
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error("Error sending webhook:", error)
  }
}

/**
 * AUDIT TRAIL (Step 14)
 */
export async function getAuditTrail(limit = 50) {
  try {
    // Try to get audit data from AuditTrail sheet
    const auditRows = await getSheetData("AuditTrail!A:E")

    if (!auditRows || auditRows.length === 0) {
      return []
    }

    // Transform audit data
    const auditData = auditRows
      .slice(1)
      .map((row) => ({
        timestamp: row[0] || "",
        orderDate: row[1] || "",
        action: row[2] || "",
        details: row[3] || "",
        user: row[4] || "System",
      }))
      .filter((entry) => entry.timestamp)

    // Sort by timestamp descending and limit results
    return auditData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit)
  } catch (error) {
    console.error("Error fetching audit trail:", error)
    // Return empty array if audit sheet doesn't exist yet
    return []
  }
}
