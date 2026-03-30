// Data validation utilities

import type { ParcelData } from "./types"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number // 0-100
}

export interface DataQualityReport {
  totalRecords: number
  validRecords: number
  invalidRecords: number
  qualityScore: number
  fieldCompleteness: {
    [field: string]: {
      filled: number
      missing: number
      percentage: number
    }
  }
  issues: {
    type: "error" | "warning"
    field: string
    message: string
    count: number
  }[]
}

export function validateParcelData(parcel: ParcelData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let score = 100

  // Required fields validation
  if (!parcel.date) {
    errors.push("Missing date")
    score -= 20
  }

  if (!parcel.status || !parcel.normalizedStatus) {
    errors.push("Missing status")
    score -= 20
  }

  if (!parcel.shipper) {
    warnings.push("Missing shipper information")
    score -= 5
  }

  // Geographic data validation
  if (!parcel.province || parcel.province === "Unknown") {
    warnings.push("Unknown or missing province")
    score -= 10
  }

  if (!parcel.region || parcel.region === "Unknown") {
    warnings.push("Unknown or missing region")
    score -= 10
  }

  if (!parcel.municipality) {
    warnings.push("Missing municipality")
    score -= 5
  }

  if (!parcel.barangay) {
    warnings.push("Missing barangay")
    score -= 5
  }

  // Financial data validation
  if (parcel.normalizedStatus === "DELIVERED" && (!parcel.codAmount || parcel.codAmount <= 0)) {
    warnings.push("Delivered parcel with no COD amount")
    score -= 5
  }

  if (parcel.totalCost && parcel.totalCost < 0) {
    errors.push("Negative total cost")
    score -= 15
  }

  if (parcel.serviceCharge && parcel.serviceCharge < 0) {
    errors.push("Negative service charge")
    score -= 15
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  }
}

export function generateDataQualityReport(parcels: ParcelData[]): DataQualityReport {
  const totalRecords = parcels.length
  let validRecords = 0
  const fieldCompleteness: DataQualityReport["fieldCompleteness"] = {}
  const issueMap = new Map<string, { type: "error" | "warning"; field: string; message: string; count: number }>()

  // Initialize field completeness tracking
  const fields = ["date", "status", "shipper", "province", "region", "municipality", "barangay", "codAmount", "serviceCharge", "totalCost"]
  fields.forEach(field => {
    fieldCompleteness[field] = { filled: 0, missing: 0, percentage: 0 }
  })

  // Validate each parcel
  parcels.forEach(parcel => {
    const validation = validateParcelData(parcel)
    
    if (validation.isValid) {
      validRecords++
    }

    // Track field completeness
    if (parcel.date) fieldCompleteness.date.filled++
    else fieldCompleteness.date.missing++

    if (parcel.status) fieldCompleteness.status.filled++
    else fieldCompleteness.status.missing++

    if (parcel.shipper) fieldCompleteness.shipper.filled++
    else fieldCompleteness.shipper.missing++

    if (parcel.province && parcel.province !== "Unknown") fieldCompleteness.province.filled++
    else fieldCompleteness.province.missing++

    if (parcel.region && parcel.region !== "Unknown") fieldCompleteness.region.filled++
    else fieldCompleteness.region.missing++

    if (parcel.municipality) fieldCompleteness.municipality.filled++
    else fieldCompleteness.municipality.missing++

    if (parcel.barangay) fieldCompleteness.barangay.filled++
    else fieldCompleteness.barangay.missing++

    if (parcel.codAmount) fieldCompleteness.codAmount.filled++
    else fieldCompleteness.codAmount.missing++

    if (parcel.serviceCharge) fieldCompleteness.serviceCharge.filled++
    else fieldCompleteness.serviceCharge.missing++

    if (parcel.totalCost) fieldCompleteness.totalCost.filled++
    else fieldCompleteness.totalCost.missing++

    // Aggregate issues
    validation.errors.forEach(error => {
      const key = `error-${error}`
      if (issueMap.has(key)) {
        issueMap.get(key)!.count++
      } else {
        issueMap.set(key, { type: "error", field: "general", message: error, count: 1 })
      }
    })

    validation.warnings.forEach(warning => {
      const key = `warning-${warning}`
      if (issueMap.has(key)) {
        issueMap.get(key)!.count++
      } else {
        issueMap.set(key, { type: "warning", field: "general", message: warning, count: 1 })
      }
    })
  })

  // Calculate percentages
  Object.keys(fieldCompleteness).forEach(field => {
    const data = fieldCompleteness[field]
    data.percentage = totalRecords > 0 ? (data.filled / totalRecords) * 100 : 0
  })

  // Calculate overall quality score
  const avgCompleteness = Object.values(fieldCompleteness).reduce((sum, field) => sum + field.percentage, 0) / fields.length
  const validPercentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0
  const qualityScore = (avgCompleteness * 0.6 + validPercentage * 0.4)

  return {
    totalRecords,
    validRecords,
    invalidRecords: totalRecords - validRecords,
    qualityScore,
    fieldCompleteness,
    issues: Array.from(issueMap.values()).sort((a, b) => b.count - a.count),
  }
}
