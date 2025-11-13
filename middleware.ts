import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)

  // Add timing header
  requestHeaders.set("x-start-time", new Date().getTime().toString())

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add cache control headers
  const isAPI = request.nextUrl.pathname.startsWith("/api/")

  if (isAPI) {
    // API routes - shorter cache
    response.headers.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300")
  } else {
    // Static pages - longer cache
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600")
  }

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")

  return response
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/api/:path*"],
}
