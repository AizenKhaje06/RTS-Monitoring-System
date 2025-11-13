import { NextResponse } from "next/server"
import { getCachedResponse, setCachedResponse, invalidateCache, getCacheStats } from "@/lib/cache-middleware.js"
import { handleApiError } from "@/lib/error-handler.js"
import { logger } from "@/lib/logger.js"

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGINS || "https://your-domain.com",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

function createResponse(data, statusCode = 200, customHeaders = {}) {
  // Add cache control header based on status
  const cacheHeader = statusCode === 200 ? "public, s-maxage=60" : "no-cache"

  return NextResponse.json(data, {
    status: statusCode,
    headers: {
      ...corsHeaders,
      "Cache-Control": cacheHeader,
      ...customHeaders,
    },
  })
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { pathname } = new URL(request.url)
    const path = pathname.replace("/api/", "")
    const { searchParams } = new URL(request.url)

    // Get cache stats endpoint
    if (path === "cache/stats") {
      return createResponse({
        success: true,
        cache: getCacheStats(),
      })
    }

    // Define endpoints that support caching
    const cacheableEndpoints = [
      "dashboard",
      "overview",
      "lifecycle",
      "issues",
      "financial",
      "analytics",
      "forecast",
      "budget",
      "audit-trail",
      "health",
    ]

    // Check if endpoint is cacheable
    const isEndpointCacheable = cacheableEndpoints.some((e) => path.startsWith(e))

    if (isEndpointCacheable) {
      // Try to get from cache
      const params = {
        sortBy: searchParams.get("sortBy"),
        startDate: searchParams.get("startDate"),
        endDate: searchParams.get("endDate"),
        page: searchParams.get("page"),
        pageSize: searchParams.get("pageSize"),
        limit: searchParams.get("limit"),
      }

      const cached = getCachedResponse(path.split("/")[0], params)
      if (cached) {
        logger.debug("Serving from cache", { endpoint: path })
        return createResponse({
          ...cached,
          _cached: true,
          _cacheAge: "recent",
        })
      }
    }

    // ... rest of the GET logic (same as before)
    // Import the original handlers here

    const { getCompleteDashboardData } = await import("@/lib/google-sheets")

    if (path === "dashboard") {
      const sortBy = searchParams.get("sortBy") || "day"
      const startDate = searchParams.get("startDate")
      const endDate = searchParams.get("endDate")

      const data = await getCompleteDashboardData(sortBy, startDate, endDate)

      // Cache successful responses
      if (data.success) {
        setCachedResponse(path, data, {
          sortBy,
          startDate,
          endDate,
        })
      }

      return createResponse(data)
    }

    // ... other endpoints

    return createResponse(handleApiError(new Error("Endpoint not found")), 404)
  } catch (error) {
    logger.error("API error", error)
    const errorResponse = handleApiError(error)
    return createResponse(errorResponse, errorResponse.statusCode)
  }
}

export async function POST(request) {
  try {
    const { pathname } = new URL(request.url)
    const path = pathname.replace("/api/", "")
    const body = await request.json()

    // Invalidate cache on write operations
    if (path.startsWith("notes/add") || path.startsWith("issues/resolve") || path.startsWith("orders/update")) {
      invalidateCache("dashboard")
      invalidateCache("overview")
      invalidateCache("issues")
      invalidateCache("financial")
      logger.info("Cache invalidated due to write operation", { endpoint: path })
    }

    // ... rest of POST logic (same as before)

    return createResponse({ success: true, message: "Operation completed" })
  } catch (error) {
    logger.error("POST error", error)
    const errorResponse = handleApiError(error)
    return createResponse(errorResponse, errorResponse.statusCode)
  }
}
