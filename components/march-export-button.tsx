"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Calendar, Loader2 } from "lucide-react"

export function MarchExportButton() {
  const [isExporting, setIsExporting] = useState(false)
  const [stats, setStats] = useState<{
    totalRecords: number
    byStatus: Record<string, number>
    byRegion: Record<string, number>
    byIsland: Record<string, number>
    estimatedSize: string
  } | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/export-march-only")
      const data = await response.json() as { stats: typeof stats }
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching March stats:", error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export-march-only", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Download the SQL file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rts-march-only-${Date.now()}.sql`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert("✅ March SQL file downloaded successfully! Open it in Supabase SQL Editor to import March data.")
    } catch (error) {
      console.error("Error exporting March data:", error)
      alert("❌ Failed to export March data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Export March Data Only</h3>
          <p className="text-sm text-muted-foreground">
            Download SQL file with March 2024/2025/2026 data only
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary rounded-md">
          <div>
            <p className="text-xs text-muted-foreground">March Records</p>
            <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">File Size</p>
            <p className="text-2xl font-bold">{stats.estimatedSize}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Islands</p>
            <p className="text-2xl font-bold">{Object.keys(stats.byIsland).length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Statuses</p>
            <p className="text-2xl font-bold">{Object.keys(stats.byStatus).length}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={fetchStats}
          variant="outline"
          disabled={isExporting}
          className="flex-1"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Preview March Stats
        </Button>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="flex-1"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download March SQL
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-semibold">Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Click &ldquo;Download March SQL&rdquo; to get March data only</li>
          <li>Open your Supabase project → SQL Editor</li>
          <li>Create a new query and paste the entire SQL file</li>
          <li>Click &ldquo;Run&rdquo; to create table and import March data</li>
          <li>Verify in Table Editor: parcels table</li>
        </ol>
        <p className="text-amber-600 dark:text-amber-400 mt-2">
          ⚠️ Note: This includes March data from 2024, 2025, and 2026
        </p>
      </div>
    </div>
  )
}
