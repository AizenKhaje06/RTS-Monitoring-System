"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, FileSpreadsheet } from "lucide-react"
import { useState } from "react"
import type { ProcessedData } from "@/lib/types"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataUpload: (data: ProcessedData) => void
}

export function UploadModal({ open, onOpenChange, onDataUpload }: UploadModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcessData = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/google-sheets/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error("Failed to process data")

      const data = await response.json()
      onDataUpload(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Error processing Google Sheets data:", error)
      alert("Failed to process data from Google Sheets. Please check your configuration.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            Enter Dashboard
          </DialogTitle>
          <DialogDescription>
            Automatically connect to your configured Google Sheets and process parcel data to enter the dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleProcessData}
            disabled={isProcessing}
            className="w-full gradient-orange hover:opacity-90 text-primary-foreground text-lg py-3"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Enter Dashboard"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Expected columns: Date, Status, Shipper, Consignee Region, COD Amount, Service Charge, Total Cost
        </p>
      </DialogContent>
    </Dialog>
  )
}
