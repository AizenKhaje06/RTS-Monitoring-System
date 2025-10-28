"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GoogleSheetsSelector } from "@/components/google-sheets-selector"
import type { ProcessedData } from "@/lib/types"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataUpload: (data: ProcessedData) => void
}

export function UploadModal({ open, onOpenChange, onDataUpload }: UploadModalProps) {
  const handleDataUpload = (data: ProcessedData) => {
    onDataUpload(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Connect Google Sheets</DialogTitle>
          <DialogDescription>
            Connect your Google Sheets containing parcel data to generate reports and analytics.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <GoogleSheetsSelector onDataUpload={handleDataUpload} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
