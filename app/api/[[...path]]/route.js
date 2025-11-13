import { NextResponse } from "next/server"
import { handleApiError, ValidationError } from "@/lib/error-handler.js"
import { logger } from "@/lib/logger.js"

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGINS || "https://your-domain.com",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

function createResponse(data, statusCode = 200, customHeaders = {}) {
  return NextResponse.json(data, {
    status: statusCode,
    headers: { ...corsHeaders, ...customHeaders },
  })
}

// GET handler
export async function GET(request) {
  try {
    const { pathname } = new URL(request.url)
    const path = pathname.replace("/api/", "")

    logger.debug("API request received", { method: "GET", path })

    // Test endpoint to verify Google Sheets connection
    if (path === "test") {
      return createResponse({
        success: true,
        message: "API is working",
        timestamp: new Date().toISOString(),
      })
    }

    // Get complete dashboard data
    if (path === "dashboard") {
      try {
        const { searchParams } = new URL(request.url)
        const sortBy = searchParams.get("sortBy") || "day"
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          throw new ValidationError("Invalid startDate format (use YYYY-MM-DD)", { startDate })
        }
        if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          throw new ValidationError("Invalid endDate format (use YYYY-MM-DD)", { endDate })
        }

        const { getCompleteDashboardData } = await import("@/lib/google-sheets")
        const data = await getCompleteDashboardData(sortBy, startDate, endDate)
        return createResponse(data)
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get overview metrics
    if (path === "overview") {
      try {
        const { getOverviewMetrics } = await import("@/lib/google-sheets")
        const data = await getOverviewMetrics()
        return createResponse({ success: true, data })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get order lifecycle
    if (path === "lifecycle") {
      try {
        const { getOrderLifecycle } = await import("@/lib/google-sheets")
        const data = await getOrderLifecycle()
        return createResponse({ success: true, data })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get issues and alerts
    if (path === "issues") {
      try {
        const { getIssuesData } = await import("@/lib/google-sheets")
        const data = await getIssuesData()
        return createResponse({ success: true, data })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get financial metrics
    if (path === "financial") {
      try {
        const { getFinancialMetrics } = await import("@/lib/google-sheets")
        const data = await getFinancialMetrics()
        return createResponse({ success: true, data })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get analytics with trends
    if (path === "analytics") {
      try {
        const { getAnalytics } = await import("@/lib/google-sheets")
        const data = await getAnalytics()
        return createResponse({ success: true, data })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get raw sheet data
    if (path === "sheets/raw") {
      try {
        // Dynamic import to avoid loading heavy dependencies upfront
        const { getSheetData } = await import("@/lib/google-sheets")
        const rows = await getSheetData()

        return createResponse({
          success: true,
          rows,
          count: rows.length,
        })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Health check endpoint
    if (path === "health") {
      const sheetsConfigured = !!(
        process.env.GOOGLE_SHEET_ID &&
        process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
        process.env.GOOGLE_SHEETS_PRIVATE_KEY
      )

      return createResponse({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          api: "running",
          sheets: sheetsConfigured ? "configured" : "not configured",
          environment: process.env.NODE_ENV,
        },
      })
    }

    // Get budget comparison
    if (path === "budget") {
      try {
        const { getBudgetComparison } = await import("@/lib/google-sheets")
        const data = await getBudgetComparison()
        return createResponse({ success: true, data })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get forecast
    if (path === "forecast") {
      try {
        const { getSheetData, transformCWAGOData, calculateForecast } = await import("@/lib/google-sheets")
        const rows = await getSheetData()
        const data = transformCWAGOData(rows)

        if (data.length === 0) {
          return createResponse({ success: false, error: "No data available for forecasting" }, 400)
        }

        const forecastResult = calculateForecast(data, 7)

        // Calculate additional forecast metrics
        const latest = data[data.length - 1]
        const recentData = data.slice(-30)
        const avgDeliveryRate =
          recentData.length > 0
            ? recentData.reduce((sum, day) => sum + (day.deliveredPercent || 0), 0) / recentData.length
            : 0

        // Predicted values for tomorrow
        const predictedOrders =
          forecastResult.forecast && forecastResult.forecast.length > 0 ? forecastResult.forecast[0].forecastOrders : 0
        const predictedRevenue =
          forecastResult.forecast && forecastResult.forecast.length > 0 ? forecastResult.forecast[0].forecastRevenue : 0

        // Generate insights
        const insights = []
        if (forecastResult.avgDailyOrderGrowth > 0) {
          insights.push({
            type: "positive",
            title: "Growing Order Volume",
            description: `Orders are increasing by ${forecastResult.avgDailyOrderGrowth.toFixed(1)} per day on average.`,
          })
        } else if (forecastResult.avgDailyOrderGrowth < 0) {
          insights.push({
            type: "warning",
            title: "Declining Order Volume",
            description: `Orders are decreasing by ${Math.abs(forecastResult.avgDailyOrderGrowth).toFixed(1)} per day on average.`,
          })
        }

        if (forecastResult.avgDailyRevenueGrowth > 0) {
          insights.push({
            type: "positive",
            title: "Revenue Growth",
            description: `Revenue is increasing by ₱${forecastResult.avgDailyRevenueGrowth.toFixed(0)} per day on average.`,
          })
        }

        // Accuracy metrics (simplified)
        const accuracy = {
          historical: 85.0, // Placeholder - would need historical comparison
          current: 78.5, // Placeholder - would need current trend analysis
        }

        const forecastData = {
          predictedOrders,
          predictedRevenue,
          predictedDeliveryRate: avgDeliveryRate,
          confidence:
            forecastResult.forecast && forecastResult.forecast.length > 0
              ? forecastResult.forecast[0].confidence * 100
              : 0,
          forecast: forecastResult.forecast || [],
          insights,
          accuracy,
        }

        return createResponse({ success: true, ...forecastData })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get data by date range
    if (path === "data/range") {
      try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get("start")
        const endDate = searchParams.get("end")

        if (!startDate || !endDate) {
          return createResponse({ success: false, error: "start and end date parameters required" }, 400)
        }

        const { getDataByDateRange } = await import("@/lib/google-sheets")
        const data = await getDataByDateRange(startDate, endDate)
        return createResponse({ success: true, data, count: data.length })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get paginated data
    if (path === "data/paginated") {
      try {
        const { searchParams } = new URL(request.url)
        const page = Number.parseInt(searchParams.get("page") || "1")
        const pageSize = Number.parseInt(searchParams.get("pageSize") || "50")

        const { getSheetData, transformCWAGOData, paginateData } = await import("@/lib/google-sheets")
        const rows = await getSheetData()
        const data = transformCWAGOData(rows)
        const result = paginateData(data, page, pageSize)

        return createResponse({ success: true, ...result })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Get audit trail
    if (path === "audit-trail") {
      try {
        const { getAuditTrail } = await import("@/lib/google-sheets")
        const data = await getAuditTrail()
        return createResponse({ success: true, data })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    return createResponse(handleApiError(new Error("Endpoint not found")), 404)
  } catch (error) {
    logger.error("Unhandled GET request error", error)
    const errorResponse = handleApiError(error)
    return createResponse(errorResponse, errorResponse.statusCode)
  }
}

// POST handler for write operations
export async function POST(request) {
  try {
    const { pathname } = new URL(request.url)
    const path = pathname.replace("/api/", "")
    const body = await request.json()

    logger.debug("API POST request received", { path })

    // Add note to order
    if (path === "notes/add") {
      try {
        const { date, note, user } = body
        if (!date || !note) {
          return createResponse({ success: false, error: "date and note are required" }, 400)
        }

        const { addOrderNote } = await import("@/lib/google-sheets")
        const result = await addOrderNote(date, note, user)
        return createResponse({ success: true, ...result })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Mark issue as resolved
    if (path === "issues/resolve") {
      try {
        const { date, issueType, resolutionNote, user } = body
        if (!date || !issueType) {
          return createResponse({ success: false, error: "date and issueType are required" }, 400)
        }

        const { markIssueResolved } = await import("@/lib/google-sheets")
        const result = await markIssueResolved(date, issueType, resolutionNote, user)
        return createResponse({ success: true, ...result })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Update order status
    if (path === "orders/update-status") {
      try {
        const { date, column, newValue, user } = body
        if (!date || !column || newValue === undefined) {
          return createResponse({ success: false, error: "date, column, and newValue are required" }, 400)
        }

        const { updateOrderStatus } = await import("@/lib/google-sheets")
        const result = await updateOrderStatus(date, column, newValue, user)
        return createResponse({ success: true, ...result })
      } catch (error) {
        const errorResponse = handleApiError(error)
        return createResponse(errorResponse, errorResponse.statusCode)
      }
    }

    // Webhook receiver
    if (path === "webhook") {
      if (!body || typeof body !== "object") {
        throw new ValidationError("Invalid webhook payload")
      }

      logger.info("Webhook received", { eventType: body.event })
      return createResponse({ success: true, message: "Webhook processed" })
    }

    return createResponse(handleApiError(new Error("Endpoint not found")), 404)
  } catch (error) {
    logger.error("Unhandled POST request error", error)
    const errorResponse = handleApiError(error)
    return createResponse(errorResponse, errorResponse.statusCode)
  }
}
