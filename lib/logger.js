const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
}

const LOG_LEVEL_PRIORITY = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || "info"
  }

  shouldLog(level) {
    const currentPriority = LOG_LEVEL_PRIORITY[level.toUpperCase()] ?? 2
    const minPriority = LOG_LEVEL_PRIORITY[this.level.toUpperCase()] ?? 2
    return currentPriority <= minPriority
  }

  formatLog(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const context = {
      timestamp,
      level,
      message,
      ...(data && { data }),
      env: process.env.NODE_ENV,
    }
    return JSON.stringify(context)
  }

  error(message, error = null) {
    if (this.shouldLog("ERROR")) {
      console.error(this.formatLog("ERROR", message, error))
    }
  }

  warn(message, data = null) {
    if (this.shouldLog("WARN")) {
      console.warn(this.formatLog("WARN", message, data))
    }
  }

  info(message, data = null) {
    if (this.shouldLog("INFO")) {
      console.log(this.formatLog("INFO", message, data))
    }
  }

  debug(message, data = null) {
    if (this.shouldLog("DEBUG")) {
      console.log(this.formatLog("DEBUG", message, data))
    }
  }
}

export const logger = new Logger()
