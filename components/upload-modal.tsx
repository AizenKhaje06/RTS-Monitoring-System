"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"
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
          <DialogTitle className="text-2xl font-bold text-foreground">Upload Excel Data</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <FileUpload onDataUpload={handleDataUpload} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
