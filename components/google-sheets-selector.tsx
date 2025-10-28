"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileSpreadsheet, CheckCircle2 } from "lucide-react"
import type { ProcessedData } from "@/lib/types"

interface GoogleSheetsSelectorProps {
  onDataUpload: (data: ProcessedData) => void
  onClose: () => void
}

export function GoogleSheetsSelector({ onDataUpload, onClose }: GoogleSheetsSelectorProps) {
  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([])
  const [sheets, setSheets] = useState<{ name: string; index: number }[]>([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>("")
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false)
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadSpreadsheets()
  }, [])

  useEffect(() => {
    if (selectedSpreadsheet) {
      loadSheets(selectedSpreadsheet)
    }
  }, [selectedSpreadsheet])

  const loadSpreadsheets = async () => {
    setIsLoadingSpreadsheets(true)
    try {
      const response = await fetch("/api/google-sheets/spreadsheets")
      if (!response.ok) throw new Error("Failed to fetch spreadsheets")
      const sheets = await response.json()
      setSpreadsheets(sheets)
      // Auto-select the first spreadsheet if available
      if (sheets.length > 0) {
        setSelectedSpreadsheet(sheets[0].id)
      }
    } catch (error) {
      console.error("Error loading spreadsheets:", error)
      alert("Failed to load spreadsheets. Please check your configuration.")
    } finally {
      setIsLoadingSpreadsheets(false)
    }
  }

  const loadSheets = async (spreadsheetId: string) => {
    setIsLoadingSheets(true)
    try {
      const response = await fetch(`/api/google-sheets/sheets?spreadsheetId=${spreadsheetId}`)
      if (!response.ok) throw new Error("Failed to fetch sheets")
      const sheetList = await response.json()
      setSheets(sheetList)
    } catch (error) {
      console.error("Error loading sheets:", error)
      alert("Failed to load sheets. Please check your configuration.")
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handleProcessData = async () => {
    if (!selectedSpreadsheet) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/google-sheets/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetId: selectedSpreadsheet,
          sheetName: selectedSheet || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to process data")

      const data = await response.json()
      onDataUpload(data)
      onClose()
    } catch (error) {
      console.error("Error processing Google Sheets data:", error)
      alert("Failed to process data from Google Sheets. Please check the format.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="glass-strong border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Select Google Sheets
        </CardTitle>
        <CardDescription>
          Choose a spreadsheet and sheet to import data from
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Connected via Service Account
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Spreadsheet</label>
          <Select value={selectedSpreadsheet} onValueChange={setSelectedSpreadsheet}>
            <SelectTrigger className="glass border-border/50">
              <SelectValue placeholder="Choose a spreadsheet..." />
            </SelectTrigger>
            <SelectContent>
              {isLoadingSpreadsheets ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                spreadsheets.map((sheet) => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedSpreadsheet && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Sheet (Optional)</label>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger className="glass border-border/50">
                <SelectValue placeholder="All sheets (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sheets</SelectItem>
                {isLoadingSheets ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  sheets.map((sheet) => (
                    <SelectItem key={sheet.index} value={sheet.name}>
                      {sheet.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleProcessData}
            disabled={!selectedSpreadsheet || isProcessing}
            className="flex-1 gradient-orange hover:opacity-90 text-primary-foreground"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Import Data"
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Expected columns: Date, Status, Shipper, Consignee Region, COD Amount, Service Charge, Total Cost
        </p>
      </CardContent>
    </Card>
  )
}
