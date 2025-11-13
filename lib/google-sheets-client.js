import { google } from "googleapis"
import { logger } from "./logger.js"
import { ConfigError } from "./error-handler.js"

let sheetsClient = null

/**
 * Validate required Google Sheets environment variables
 */
function validateCredentials() {
  const requiredVars = ["GOOGLE_SHEETS_PRIVATE_KEY", "GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEET_ID"]
  const missing = requiredVars.filter((v) => !process.env[v])

  if (missing.length > 0) {
    const error = new ConfigError(`Missing Google Sheets credentials: ${missing.join(", ")}`)
    logger.error(error.message)
    throw error
  }
}

/**
 * Initialize Google Sheets API client (singleton pattern)
 */
export function getGoogleSheetsClient() {
  if (sheetsClient) {
    return sheetsClient
  }

  try {
    validateCredentials()

    const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n")

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
        type: "service_account",
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly", "https://www.googleapis.com/auth/spreadsheets"],
    })

    sheetsClient = google.sheets({ version: "v4", auth })
    logger.info("Google Sheets client initialized successfully")

    return sheetsClient
  } catch (error) {
    logger.error("Failed to initialize Google Sheets client", error)
    throw error
  }
}

/**
 * Reset client (useful for testing)
 */
export function resetSheetsClient() {
  sheetsClient = null
}
