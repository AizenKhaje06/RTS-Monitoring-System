"use client"

import { useState, useEffect } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileSpreadsheet, CheckCircle2 } from "lucide-react"
import type { ProcessedData } from "@/lib/types"
import { processGoogleSheetsData, getUserSpreadsheets, getSpreadsheetSheets } from "@/lib/google-sheets-processor"

interface GoogleSheetsSelectorProps {
  onDataUpload: (data: ProcessedData) => void
  onClose: () => void
}

export function GoogleSheetsSelector({ onDataUpload, onClose }: GoogleSheetsSelectorProps) {
  const { data: session, status } = useSession()
  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([])
  const [sheets, setSheets] = useState<{ name: string; index: number }[]>([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>("")
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false)
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // @ts-expect-error - accessToken is added to session
    if (session?.accessToken) {
      loadSpreadsheets()
    }
  }, [session?.accessToken])

  useEffect(() => {
    if (selectedSpreadsheet) {
      loadSheets(selectedSpreadsheet)
    }
  }, [selectedSpreadsheet, session?.accessToken])

  const loadSpreadsheets = async () => {
    // @ts-expect-error - accessToken is added to session
    if (!session?.accessToken) return

    setIsLoadingSpreadsheets(true)
    try {
      // @ts-expect-error - accessToken is added to session
      const sheets = await getUserSpreadsheets(session.accessToken)
      setSpreadsheets(sheets)
    } catch (error) {
      console.error("Error loading spreadsheets:", error)
      alert("Failed to load spreadsheets. Please check your permissions.")
    } finally {
      setIsLoadingSpreadsheets(false)
    }
  }

  const loadSheets = async (spreadsheetId: string) => {
    // @ts-expect-error - accessToken is added to session
    if (!session?.accessToken) return

    setIsLoadingSheets(true)
    try {
      // @ts-expect-error - accessToken is added to session
      const sheetList = await getSpreadsheetSheets(session.accessToken, spreadsheetId)
      setSheets(sheetList)
    } catch (error) {
      console.error("Error loading sheets:", error)
      alert("Failed to load sheets. Please check your permissions.")
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handleProcessData = async () => {
    // @ts-expect-error - accessToken is added to session
    if (!session?.accessToken || !selectedSpreadsheet) return

    setIsProcessing(true)
    try {
      // @ts-expect-error - accessToken is added to session
      const data = await processGoogleSheetsData(
        session.accessToken,
        selectedSpreadsheet,
        selectedSheet || undefined
      )
      onDataUpload(data)
      onClose()
    } catch (error) {
      console.error("Error processing Google Sheets data:", error)
      alert("Failed to process data from Google Sheets. Please check the format.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <Card className="glass-strong border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Connect Google Sheets
          </CardTitle>
          <CardDescription>
            Sign in with Google to access your spreadsheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => signIn("google")}
            className="w-full gradient-orange hover:opacity-90"
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    )
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
          Connected as {session.user?.email}
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
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="glass border-border/50"
          >
            Sign Out
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Expected columns: Date, Status, Shipper, Consignee Region, COD Amount, Service Charge, Total Cost
        </p>
      </CardContent>
    </Card>
  )
}
