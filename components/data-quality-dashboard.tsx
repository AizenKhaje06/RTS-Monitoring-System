"use client"

import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface DataQualityDashboardProps {
  data: unknown | null
}

export function DataQualityDashboard({ data }: DataQualityDashboardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Data quality reporting is temporarily unavailable. This feature requires full dataset access.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality Report</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Data quality reporting is temporarily unavailable. This feature requires full dataset access.
        </p>
      </CardContent>
    </Card>
  )
}
