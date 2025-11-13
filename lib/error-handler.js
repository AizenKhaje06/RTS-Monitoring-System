import { logger } from "./logger.js"

class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.code = code
    this.timestamp = new Date().toISOString()
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR")
    this.details = details
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "AUTH_ERROR")
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND")
  }
}

export class ConfigError extends AppError {
  constructor(message) {
    super(message, 500, "CONFIG_ERROR")
  }
}

export class SheetsError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, "SHEETS_ERROR")
    this.originalError = originalError?.message
  }
}

export function handleApiError(error) {
  if (error instanceof AppError) {
    logger.error(`[${error.code}] ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
    })

    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      statusCode: error.statusCode,
    }
  }

  // Handle Google Sheets API errors
  if (error.message?.includes("Sheets")) {
    logger.error("Google Sheets API Error", {
      message: error.message,
      code: error.code,
    })

    return {
      success: false,
      error: {
        message: "Failed to fetch data from Google Sheets. Check your credentials.",
        code: "SHEETS_ERROR",
      },
      statusCode: 500,
    }
  }

  // Handle generic errors
  logger.error("Unhandled API Error", {
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  })

  return {
    success: false,
    error: {
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      code: "INTERNAL_ERROR",
    },
    statusCode: 500,
  }
}

export { AppError }
