"use client"

import { AlertTriangle, Lightbulb, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PredictiveInsightsProps {
  data: { analytics?: { insights: unknown[] } } | null
}

export function PredictiveInsights({ data }: PredictiveInsightsProps) {
  const insights = data?.analytics?.insights || []

  if (!data || insights.length === 0) {
    return null
  }

  const getIcon = (type: "warning" | "opportunity" | "info") => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "opportunity":
        return <Lightbulb className="w-5 h-5 text-yellow-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getImpactColor = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Insights & Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight: any, index: number) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-border bg-secondary/20"
          >
            <div className="flex items-start gap-3 mb-3">
              {getIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <Badge className={getImpactColor(insight.impact)}>
                    {insight.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {insight.description}
                </p>
                <div className="p-3 rounded bg-primary/5 border border-primary/10">
                  <p className="text-sm font-medium text-primary">
                    💡 Recommendation: {insight.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
