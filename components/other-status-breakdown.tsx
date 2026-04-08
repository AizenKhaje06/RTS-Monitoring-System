"use client"

import { useMemo } from "react"
import { AlertTriangle, FileQuestion } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProcessedData } from "@/lib/types"

interface OtherStatusBreakdownProps {
  data: ProcessedData
}

interface OtherStatusDetail {
  rawStatus: string
  count: number
  provinces: Record<string, number>
  sampleTracking: string[]
}

export function OtherStatusBreakdown({ data }: OtherStatusBreakdownProps) {
  const otherStatusDetails = useMemo(() => {
    const details: Record<string, OtherStatusDetail> = {}

    // Get all parcels with "OTHER" normalized status
    const otherParcels = data.all.data.filter(
      (parcel) => parcel.normalizedStatus === "OTHER"
    )

    otherParcels.forEach((parcel) => {
      const rawStatus = parcel.status || "(Empty)"
      
      if (!details[rawStatus]) {
        details[rawStatus] = {
          rawStatus,
          count: 0,
          provinces: {},
          sampleTracking: [],
        }
      }

      details[rawStatus].count++
      
      // Track provinces
      const province = parcel.province || "Unknown"
      details[rawStatus].provinces[province] = 
        (details[rawStatus].provinces[province] || 0) + 1

      // Keep sample tracking numbers (max 3)
      if (details[rawStatus].sampleTracking.length < 3 && parcel.tracking) {
        details[rawStatus].sampleTracking.push(parcel.tracking)
      }
    })

    // Convert to array and sort by count
    return Object.values(details).sort((a, b) => b.count - a.count)
  }, [data])

  const totalOtherCount = useMemo(() => {
    return otherStatusDetails.reduce((sum, detail) => sum + detail.count, 0)
  }, [otherStatusDetails])

  if (totalOtherCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-green-600" />
            OTHER Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ✅ No parcels with "OTHER" status found. All statuses are properly categorized!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          OTHER Status Breakdown
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Total parcels with "OTHER" status: <span className="font-bold text-foreground">{totalOtherCount}</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Note:</strong> These parcels have status values that don't match any standard categories. 
              Review the raw status values below and consider standardizing them in your source data.
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Raw Status Value</TableHead>
                  <TableHead className="text-center">Count</TableHead>
                  <TableHead className="text-center">% of OTHER</TableHead>
                  <TableHead>Top Provinces</TableHead>
                  <TableHead>Sample Tracking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherStatusDetails.map((detail) => {
                  const percentage = ((detail.count / totalOtherCount) * 100).toFixed(1)
                  const topProvinces = Object.entries(detail.provinces)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([province, count]) => `${province} (${count})`)
                    .join(", ")

                  return (
                    <TableRow key={detail.rawStatus}>
                      <TableCell className="font-mono text-sm">
                        {detail.rawStatus === "(Empty)" ? (
                          <span className="text-red-600 font-semibold">{detail.rawStatus}</span>
                        ) : (
                          <span className="text-orange-600">{detail.rawStatus}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {detail.count}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {percentage}%
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {topProvinces || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {detail.sampleTracking.length > 0
                          ? detail.sampleTracking.join(", ")
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
              💡 Recommendations:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Review empty status cells in your Google Sheets (Column H)</li>
              <li>Standardize status values to: DELIVERED, ONDELIVERY, PENDING, INTRANSIT, CANCELLED, DETAINED, PROBLEMATIC, RETURNED</li>
              <li>Use data validation (dropdown) in Google Sheets to prevent invalid entries</li>
              <li>Check the sample tracking numbers above to locate these parcels in your source data</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
