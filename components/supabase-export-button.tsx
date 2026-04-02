"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Database, Loader2 } from "lucide-react"

export function SupabaseExportButton() {
  const [isExporting, setIsExporting] = useState(false)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/export-to-supabase")
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export-to-supabase", {
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
      a.download = `rts-supabase-migration-${Date.now()}.sql`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert("✅ SQL file downloaded successfully! Open it in Supabase SQL Editor to import your data.")
    } catch (error) {
      console.error("Error exporting to Supabase:", error)
      alert("❌ Failed to export data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Export to Supabase</h3>
          <p className="text-sm text-muted-foreground">
            Migrate all Google Sheets data to Supabase database
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary rounded-md">
          <div>
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">File Size</p>
            <p className="text-2xl font-bold">{stats.estimatedSize}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Regions</p>
            <p className="text-2xl font-bold">{Object.keys(stats.byRegion).length}</p>
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
          <Database className="mr-2 h-4 w-4" />
          Preview Stats
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
              Download SQL File
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-semibold">Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Click &ldquo;Download SQL File&rdquo; to get the migration script</li>
          <li>Open your Supabase project → SQL Editor</li>
          <li>Create a new query and paste the entire SQL file</li>
          <li>Click &ldquo;Run&rdquo; to create table and import all data</li>
          <li>Verify in Table Editor: parcels table</li>
        </ol>
      </div>
    </div>
  )
}
